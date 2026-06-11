import { Vibration } from 'react-native';

/** Small haptic tap; defaults to 20ms. */
export function vibrate(time = 20): void {
  Vibration.vibrate(time > 0 ? time : 20);
}

export default { vibrate };
