import { AppState } from 'react-native';
import type { AppStateStatus, NativeEventSubscription } from 'react-native';
import {
  COMMAND_CODES,
  DRIVE_LEVEL_MAX,
  DRIVE_LEVEL_MIN,
  DRIVE_LEVEL_STEP,
  DRIVE_STATE_ACTIVE_REFRESH_MS,
  DRIVE_STATE_IDLE_REFRESH_MS,
  DRIVE_STEER,
  DRIVE_THROTTLE,
  encodeDriveState,
} from '../../shared/protocol';
import type { SteerState, ThrottleState } from '../../shared/protocol';
import { send } from './transmitter';
import { acquireDriveLocks, releaseDriveLocks } from './drive-locks';

/**
 * The app side of the "motion lease" — the drive session. Streams the ABSOLUTE
 * drive state (throttle f/n/b + forward level 0..100 + steering l/c/r) as a `dv`
 * frame: immediately on a direction change, coalesced (>= SEND_MIN_INTERVAL_MS)
 * on same-direction level changes, re-asserted every 150ms while engaged, and
 * once a second while idle. The firmware honours a non-neutral throttle only for
 * ~600ms since the last frame, so a lost frame self-corrects on the next one.
 *
 * A resting finger sends neutral (a forward level below one step is coerced to
 * neutral), so it holds no lease and the first real push is an n->f press.
 */

// Same-direction forward level changes send at most this often; a skipped one is
// re-asserted by the 150ms heartbeat. Direction changes always send immediately.
const SEND_MIN_INTERVAL_MS = 60;

let throttle: ThrottleState = DRIVE_THROTTLE.NEUTRAL;
let steer: SteerState = DRIVE_STEER.CENTER;
let forwardLevel = 0; // 0..100, meaningful only while throttle is FORWARD
let ticker: ReturnType<typeof setInterval> | null = null;
let appStateSub: NativeEventSubscription | null = null;
let lastSentAt = 0;
let suspended = false;

function engaged(): boolean {
  return throttle !== DRIVE_THROTTLE.NEUTRAL || steer !== DRIVE_STEER.CENTER;
}

function transmit(): void {
  lastSentAt = Date.now();
  send(
    encodeDriveState(
      throttle,
      steer,
      throttle === DRIVE_THROTTLE.FORWARD ? forwardLevel : undefined,
    ),
  );
}

/** Same-direction level change: send now only if the min interval has elapsed;
 * otherwise the heartbeat re-asserts the latest state within one refresh. */
function transmitCoalesced(): void {
  if (Date.now() - lastSentAt >= SEND_MIN_INTERVAL_MS) {
    transmit();
  }
}

/** One ticker beat: re-assert the state at the cadence the situation needs. */
function tick(): void {
  if (suspended) {
    return;
  }
  const cadence = engaged() ? DRIVE_STATE_ACTIVE_REFRESH_MS : DRIVE_STATE_IDLE_REFRESH_MS;
  if (Date.now() - lastSentAt >= cadence) {
    transmit();
  }
}

function handleAppState(state: AppStateStatus): void {
  if (state === 'background') {
    throttle = DRIVE_THROTTLE.NEUTRAL;
    steer = DRIVE_STEER.CENTER;
    forwardLevel = 0;
    send(COMMAND_CODES.STOP);
    suspended = true;
    return;
  }
  if (state === 'active') {
    suspended = false;
  }
}

/**
 * Update the desired throttle (+ forward level 0..100). Forward below one
 * quantization step is coerced to neutral. Direction changes send immediately;
 * same-direction level changes are coalesced. Input while suspended is dropped.
 */
export function setThrottle(next: ThrottleState, level = 0): void {
  if (suspended) {
    return;
  }
  let t = next;
  let lvl = 0;
  if (t === DRIVE_THROTTLE.FORWARD) {
    lvl = Math.max(DRIVE_LEVEL_MIN, Math.min(DRIVE_LEVEL_MAX, Math.round(level)));
    if (lvl < DRIVE_LEVEL_STEP) {
      t = DRIVE_THROTTLE.NEUTRAL;
      lvl = 0;
    }
  }
  if (t === throttle && lvl === forwardLevel) {
    return;
  }
  const directionChanged = t !== throttle;
  throttle = t;
  forwardLevel = lvl;
  if (directionChanged) {
    transmit();
  } else {
    transmitCoalesced();
  }
}

/** Update the desired steering. Sends immediately when it changes. */
export function setSteer(next: SteerState): void {
  if (suspended || next === steer) {
    return;
  }
  steer = next;
  transmit();
}

/** Begin a drive session: assert neutral, start the ticker, watch backgrounding,
 * hold the native locks. Idempotent. */
export function startDriveSession(): void {
  if (ticker) {
    return;
  }
  throttle = DRIVE_THROTTLE.NEUTRAL;
  steer = DRIVE_STEER.CENTER;
  forwardLevel = 0;
  suspended = false;
  transmit();
  ticker = setInterval(tick, DRIVE_STATE_ACTIVE_REFRESH_MS);
  appStateSub = AppState.addEventListener('change', handleAppState);
  acquireDriveLocks();
}

/** End the drive session: stop the ticker, release the locks, and send one stop. */
export function stopDriveSession(): void {
  if (!ticker) {
    return;
  }
  clearInterval(ticker);
  ticker = null;
  appStateSub?.remove();
  appStateSub = null;
  throttle = DRIVE_THROTTLE.NEUTRAL;
  steer = DRIVE_STEER.CENTER;
  forwardLevel = 0;
  send(COMMAND_CODES.STOP);
  releaseDriveLocks();
}

export default { setThrottle, setSteer, startDriveSession, stopDriveSession };
