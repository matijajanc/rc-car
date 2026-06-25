import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import styles from '../assets/styles/styles';

interface Props {
  callbackBtnPress: () => void;
  callbackBtnRelease: () => void;
  additionalStyles?: StyleProp<ViewStyle>;
  arrow: React.ReactNode;
}

/**
 * A momentary "press and hold" drive button.
 *
 * Deliberately built on react-native-gesture-handler instead of Pressable /
 * Touchable. RN's JS responder system hands the "responder" role to a single
 * view at a time, so two Touchables can never be held together — pressing the
 * steer button while the throttle was already down was silently swallowed (the
 * second onPressIn never fired). RNGH recognises each gesture independently on
 * the native thread, so several buttons can be held at once (throttle + steer)
 * and a press still registers while the JS thread is busy animating the gauges.
 *
 * - minDuration(0): the long-press activates the instant the finger lands, so
 *   there is no hold delay before the car starts moving.
 * - onBegin / onFinalize: RNGH guarantees every onBegin is paired with exactly
 *   one onFinalize, so press and release can't desync — the car is never left
 *   with the throttle stuck on if a gesture is interrupted.
 * - maxDistance + shouldCancelWhenOutside(false): a driver's thumb drifts while
 *   holding; don't cancel the press just because it slid off the button edge.
 */
const DriveButton = ({
  callbackBtnPress,
  callbackBtnRelease,
  additionalStyles,
  arrow,
}: Props): React.JSX.Element => {
  const [pressed, setPressed] = useState(false);

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(0)
        .maxDistance(10000)
        .shouldCancelWhenOutside(false)
        .onBegin(() => {
          setPressed(true);
          callbackBtnPress();
        })
        .onFinalize(() => {
          setPressed(false);
          callbackBtnRelease();
        }),
    [callbackBtnPress, callbackBtnRelease],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.button, additionalStyles, pressed && styles.buttonActive]}>{arrow}</View>
    </GestureDetector>
  );
};

export default DriveButton;
