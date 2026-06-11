import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Orientation from 'react-native-orientation-locker';
import { send } from '../../utils/transmitter';
import { vibrate } from '../../utils/vibrate';
import Container from '../Common/Container/ContainerComponent';
import SteerCalibrate from './components/SteerCalibrate';

export default function SteerCalibrateContainer(): React.JSX.Element {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('setting-sc').then((stored) => {
      if (stored) {
        setAngle(parseInt(stored, 10));
      }
    });
    Orientation.lockToPortrait();
  }, []);

  const calibrate = (direction: 'increment' | 'decrement'): void => {
    setAngle((current) => {
      const blocked =
        (current <= -15 && direction === 'decrement') ||
        (current >= 15 && direction === 'increment');
      if (blocked) {
        return current;
      }
      const next = current + (direction === 'increment' ? 1 : -1);
      send(`sc${next}`);
      void AsyncStorage.setItem('setting-sc', String(next));
      vibrate();
      return next;
    });
  };

  return (
    <Container>
      <SteerCalibrate angle={angle} callback={calibrate} />
    </Container>
  );
}
