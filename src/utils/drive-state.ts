import { AppState } from 'react-native';
import type { AppStateStatus, NativeEventSubscription } from 'react-native';
import {
  COMMAND_CODES,
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
 * The app side of the "motion lease" — the drive session.
 *
 * While the drive screen is up, this module owns the desired drive state
 * (throttle f/n/b + steering l/c/r) and transmits it as an ABSOLUTE `dv` frame:
 *
 *  - immediately on every change (press/release feel stays instant);
 *  - re-asserted every 150ms while any control is engaged — the firmware only
 *    honours a non-neutral throttle for ~600ms since the last frame, so up to
 *    3-4 consecutive lost/late frames are tolerated before the car coasts;
 *  - once a second while everything is neutral. That idle tick is NOT a safety
 *    signal (a parked car needs no lease) — it exists purely to keep the
 *    phone's Wi-Fi radio out of power-save through driving pauses, so the
 *    first press afterwards reacts instantly.
 *
 * Because every frame restates the FULL state, a lost frame is corrected by
 *  the next one: there are no press/release events that can go missing, and no
 * keep-alive that could keep a stale throttle alive. If this module stops
 * running for any reason — JS stall, app death, backgrounding — the worst case
 * is the car coasting to neutral, never continuing to drive.
 *
 * Backgrounding (call, Home, screen off) suspends the RN JS thread, so the
 * moment the 'background' event arrives (it still reaches JS) we zero the
 * state and send one explicit stop; the lease is the backstop if even that
 * frame is lost.
 */

let throttle: ThrottleState = DRIVE_THROTTLE.NEUTRAL;
let steer: SteerState = DRIVE_STEER.CENTER;
let ticker: ReturnType<typeof setInterval> | null = null;
let appStateSub: NativeEventSubscription | null = null;
let lastSentAt = 0;
let suspended = false;

function engaged(): boolean {
  return throttle !== DRIVE_THROTTLE.NEUTRAL || steer !== DRIVE_STEER.CENTER;
}

function transmit(): void {
  lastSentAt = Date.now();
  send(encodeDriveState(throttle, steer));
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
    // Lost the foreground (call, app switch, Home, screen off). Zero the state
    // and stop the car now, while we can still send; the motion lease covers
    // the case where even this frame is lost. 'inactive' (an iOS-only
    // transient like Control Centre) is deliberately ignored.
    throttle = DRIVE_THROTTLE.NEUTRAL;
    steer = DRIVE_STEER.CENTER;
    send(COMMAND_CODES.STOP);
    suspended = true;
    return;
  }
  if (state === 'active') {
    // Back in the foreground. State is neutral, so nothing moves until the
    // driver deliberately presses again.
    suspended = false;
  }
}

/**
 * Update the desired throttle. Sends immediately when it changes. Input while
 * suspended is DROPPED, not queued — otherwise a touch state captured around
 * backgrounding could re-assert itself on foregrounding with no finger on the
 * button. After a resume only a fresh press moves the car.
 */
export function setThrottle(next: ThrottleState): void {
  if (suspended || next === throttle) {
    return;
  }
  throttle = next;
  transmit();
}

/** Update the desired steering. Sends immediately when it changes. */
export function setSteer(next: SteerState): void {
  if (suspended || next === steer) {
    return;
  }
  steer = next;
  transmit();
}

/**
 * Begin a drive session (drive screen mounted): start the state ticker, watch
 * for backgrounding, and hold the native radio/screen locks. Idempotent.
 */
export function startDriveSession(): void {
  if (ticker) {
    return;
  }
  throttle = DRIVE_THROTTLE.NEUTRAL;
  steer = DRIVE_STEER.CENTER;
  suspended = false;
  transmit(); // assert a known-neutral state right away
  ticker = setInterval(tick, DRIVE_STATE_ACTIVE_REFRESH_MS);
  appStateSub = AppState.addEventListener('change', handleAppState);
  acquireDriveLocks();
}

/**
 * End the drive session (drive screen unmounted): stop the ticker, release the
 * locks, and send one explicit stop so the car doesn't wait out its lease.
 */
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
  send(COMMAND_CODES.STOP);
  releaseDriveLocks();
}

export default { setThrottle, setSteer, startDriveSession, stopDriveSession };
