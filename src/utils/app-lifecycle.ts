import { AppState } from 'react-native';
import type { AppStateStatus, NativeEventSubscription } from 'react-native';
import { COMMAND_CODES } from '../../shared/protocol';
import { send } from './transmitter';
import { start as startKeepAlive, stop as stopKeepAlive } from './keep-alive';

/**
 * Safety lifecycle hook: stop the car when the app loses the foreground.
 *
 * Tuned for Android, where the car is driven. An incoming call, an app switch,
 * Home, or the screen turning off all move the activity to the 'background'
 * state — and backgrounding suspends the JS thread, which silently freezes the
 * keep-alive, so the car would coast on its last throttle command until its own
 * 300ms keep-alive timeout caught up. Instead, the moment we go to 'background'
 * (this event still reaches JS) we send an explicit stop and pause the
 * keep-alive; the car's own safety-stop still backs us up. On return to
 * 'active' we resume the keep-alive — the car was left stopped, so it only
 * moves again on a deliberate press.
 *
 * 'inactive' is essentially an iOS-only transient (Control Centre, a
 * notification banner, the app switcher); we deliberately ignore it so the car
 * doesn't stop on a momentary peek. A real interruption on iOS proceeds to
 * 'background' anyway, with the keep-alive timeout as the backstop.
 */
let sub: NativeEventSubscription | null = null;

function handleChange(state: AppStateStatus): void {
  if (state === 'background') {
    // Lost the foreground (call, app switch, Home, screen off). Stop now, while
    // we can still send, then pause the keep-alive.
    send(COMMAND_CODES.STOP);
    stopKeepAlive();
    return;
  }
  if (state === 'active') {
    // Back in the foreground — resume the keep-alive (idempotent).
    startKeepAlive();
  }
  // 'inactive' (iOS transient) is intentionally ignored.
}

/** Begin watching foreground/background transitions. Idempotent. */
export function start(): void {
  if (sub) {
    return;
  }
  sub = AppState.addEventListener('change', handleChange);
}

/** Stop watching (used on teardown / in tests). */
export function stop(): void {
  if (sub) {
    sub.remove();
    sub = null;
  }
}

export default { start, stop };
