import { Vibration } from 'react-native';

/**
 * Small haptic tap; defaults to 20ms. Best-effort and never throws: haptics are
 * non-essential, so a missing VIBRATE permission, absent motor, or emulator must
 * not crash the app (especially mid-drive on the dashboard).
 */
export function vibrate(time = 20): void {
  try {
    Vibration.vibrate(time > 0 ? time : 20);
  } catch {
    // Ignore vibrator/permission errors — haptics are non-critical.
  }
}

export default { vibrate };
