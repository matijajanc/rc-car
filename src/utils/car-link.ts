import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../shared/protocol';
import { sendAll } from './settings';

/**
 * Liveness monitor for the *car* link — the radio/serial hop between the bridge
 * server and the car — which is independent of the app↔server WebSocket.
 *
 * Why this exists: the WebSocket can stay happily "connected" while the car is
 * out of radio range or has powered down. When that happens the car's motion
 * lease expires and it coasts to a stop on its own, but the app would otherwise
 * still show green and give no hint why the car died. We can't observe the
 * radio hop directly, so we use telemetry as a proxy: the firmware streams `sp`
 * every ~500ms (even when stopped), so a few-second silence means the car link
 * is down — not just app↔server jitter.
 *
 * Emits {@link CAR_LINK_EVENT} with 'alive' | 'lost' on every transition (the
 * drive dashboard shows a banner off this). On recovery it also replays the
 * stored settings, because a car that went quiet may have brown-out reset and
 * come back on its firmware defaults (range sensors on, default speed factor
 * and underglow); since the app↔server socket never dropped, nothing else
 * would re-sync it.
 */
export type CarLinkStatus = 'alive' | 'lost';
export const CAR_LINK_EVENT = 'carLinkStatus';

// The firmware streams `sp` every ~500ms; require several missed frames so
// normal jitter never trips the alert. Comfortably above the car's own 400ms
// motion-lease window and under the server's 3s telemetry-gap log.
const CAR_LINK_TIMEOUT_MS = 2500;
const CHECK_INTERVAL_MS = 500;
// A car that reset after a >2.5s gap fires both paths at once (recovery + boot
// beacon); collapse them into a single settings replay.
const RESYNC_DEBOUNCE_MS = 1000;

let telemetrySub: string | null = null;
let checkTimer: ReturnType<typeof setInterval> | null = null;
let lastSeen = 0;
let lastResyncAt = 0;
let status: CarLinkStatus = 'alive';

/**
 * Replay the stored settings to the car (debounced). Sends only options
 * (sf/sc/rc/rs/lights/blinkers/underglow), never a drive command, so it can
 * never make the car move on its own.
 */
function resync(): void {
  const t = Date.now();
  if (t - lastResyncAt < RESYNC_DEBOUNCE_MS) {
    return;
  }
  lastResyncAt = t;
  void sendAll();
}

function setStatus(next: CarLinkStatus): void {
  if (next === status) {
    return;
  }
  status = next;
  EventRegister.emit(CAR_LINK_EVENT, next);
  if (next === 'alive') {
    // Telemetry resumed — the car may have reset while it was silent (if the
    // outage was long enough to register), so replay the saved settings rather
    // than leaving it on its power-on defaults.
    resync();
  }
}

/** Current car-link status ('alive' until proven 'lost'). */
export function getStatus(): CarLinkStatus {
  return status;
}

/**
 * Begin watching telemetry liveness. Idempotent — call it on every connect;
 * a repeat call just refreshes the clock so a reconnect can't immediately
 * read as 'lost'.
 */
export function start(): void {
  lastSeen = Date.now();
  if (checkTimer) {
    return;
  }
  status = 'alive';
  telemetrySub = EventRegister.addEventListener('wsReceive', (frame: Telemetry) => {
    lastSeen = Date.now();
    setStatus('alive');
    // A boot beacon means the car (re)started — resync even when the reboot was
    // too quick to register as a 'lost' link (the common brown-out case).
    if (frame.code === TELEMETRY_CODES.CAR_BOOT) {
      resync();
    }
  }) as string;
  checkTimer = setInterval(() => {
    if (Date.now() - lastSeen > CAR_LINK_TIMEOUT_MS) {
      setStatus('lost');
    }
  }, CHECK_INTERVAL_MS);
}

/** Stop watching and reset state (used on teardown / in tests). */
export function stop(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
  if (telemetrySub) {
    EventRegister.removeEventListener(telemetrySub);
    telemetrySub = null;
  }
  status = 'alive';
  lastResyncAt = 0;
}

export default { start, stop, getStatus, CAR_LINK_EVENT };
