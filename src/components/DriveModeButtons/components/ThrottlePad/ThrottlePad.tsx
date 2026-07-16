import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DRIVE_THROTTLE } from '../../../../../shared/protocol';
import type { ThrottleState } from '../../../../../shared/protocol';
import { resolveThrottle } from '../../../../utils/throttle-curve';
import styles from '../assets/styles/styles';

interface Props {
  onThrottle: (throttle: ThrottleState, level?: number) => void;
}

interface PadState {
  throttle: ThrottleState;
  level: number;
}

/**
 * Vertical throttle touchpad. The finger's Y position sets an absolute throttle:
 * top 3/4 = variable forward, bottom 1/4 = fixed reverse, boundary = neutral.
 * Releasing coasts to neutral (spring-loaded), so the car moves only while held.
 *
 * Built on react-native-gesture-handler Pan (like DriveButton) so it recognises
 * the gesture on the native thread and coexists with a held steer button.
 * minDistance(0) activates immediately; onBegin gives the touch-down position,
 * onUpdate tracks movement, onFinalize (paired with onBegin) reports release.
 */
const ThrottlePad = ({ onThrottle }: Props): React.JSX.Element => {
  const heightRef = useRef(0);
  const [pad, setPad] = useState<PadState>({ throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 });

  const apply = useCallback(
    (y: number): void => {
      const res = resolveThrottle(y, heightRef.current);
      onThrottle(res.throttle, res.level);
      setPad(res);
    },
    [onThrottle],
  );

  const release = useCallback((): void => {
    onThrottle(DRIVE_THROTTLE.NEUTRAL, 0);
    setPad({ throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 });
  }, [onThrottle]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => apply(e.y))
        .onUpdate((e) => apply(e.y))
        .onFinalize(() => release()),
    [apply, release],
  );

  const onLayout = (e: LayoutChangeEvent): void => {
    heightRef.current = e.nativeEvent.layout.height;
  };

  const forward = pad.throttle === DRIVE_THROTTLE.FORWARD;
  const reverse = pad.throttle === DRIVE_THROTTLE.REVERSE;
  const label = forward ? `Forward · ${pad.level}%` : reverse ? 'Reverse' : 'Idle · 0%';

  return (
    <View style={styles.throttlePad}>
      <GestureDetector gesture={gesture}>
        <View style={styles.throttleInner} onLayout={onLayout}>
          <View style={styles.forwardZone}>
            {forward && <View style={[styles.forwardFill, { height: `${pad.level}%` }]} />}
          </View>
          <View style={styles.neutralLine} />
          <View style={styles.reverseZone}>{reverse && <View style={styles.reverseFill} />}</View>
          <Text style={[styles.padReadout, (forward || reverse) && styles.padReadoutActive]}>
            {label}
          </Text>
        </View>
      </GestureDetector>
    </View>
  );
};

export default ThrottlePad;
