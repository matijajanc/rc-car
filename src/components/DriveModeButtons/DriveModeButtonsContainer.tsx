import React, { useEffect } from 'react';
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

  // The drive session lives exactly as long as this screen: the drive-state
  // ticker streams the held controls to the car, and the native locks keep the
  // Wi-Fi radio + screen awake. Unmounting stops the car explicitly.
  useEffect(() => {
    Orientation.lockToLandscape();
    startDriveSession();
    return () => {
      stopDriveSession();
      Orientation.lockToPortrait();
    };
  }, []);

  const onThrottle = (t: ThrottleState): void => {
    setThrottle(t);
    if (t !== DRIVE_THROTTLE.NEUTRAL) {
      vibrate();
    }
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
