import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Orientation from 'react-native-orientation-locker';
import { DRIVE_STEER, DRIVE_THROTTLE } from '../../../shared/protocol';
import type { SteerState, ThrottleState } from '../../../shared/protocol';
import {
  setSteer,
  setThrottle,
  startDriveSession,
  stopDriveSession,
} from '../../utils/drive-state';
import { vibrate } from '../../utils/vibrate';
import Container from '../Common/Container/ContainerComponent';
import DriveModeButtons from './components/DriveModeButtons';
import type { RootStackParamList } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DriveModeButtonsContainer(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  // Last throttle DIRECTION, so we buzz once on entering forward/reverse rather
  // than on every level change during a continuous drag.
  const prevThrottle = useRef<ThrottleState>(DRIVE_THROTTLE.NEUTRAL);

  useEffect(() => {
    Orientation.lockToLandscape();
    startDriveSession();
    return () => {
      stopDriveSession();
      Orientation.lockToPortrait();
    };
  }, []);

  const onThrottle = (t: ThrottleState, level = 0): void => {
    setThrottle(t, level);
    if (t !== prevThrottle.current && t !== DRIVE_THROTTLE.NEUTRAL) {
      vibrate();
    }
    prevThrottle.current = t;
  };

  const onSteer = (s: SteerState): void => {
    setSteer(s);
    if (s !== DRIVE_STEER.CENTER) {
      vibrate();
    }
  };

  return (
    <Container>
      <DriveModeButtons
        onThrottle={onThrottle}
        onSteer={onSteer}
        navigate={(route: string) => navigation.navigate(route as never)}
      />
    </Container>
  );
}
