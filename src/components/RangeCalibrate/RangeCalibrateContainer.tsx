import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Orientation from 'react-native-orientation-locker';
import { send } from '../../utils/transmitter';
import { vibrate } from '../../utils/vibrate';
import Container from '../Common/Container/ContainerComponent';
import RangeCalibrate from './components/RangeCalibrate';

/**
 * Trim the centre angle of the front range-sensor sweep servo (`rc`), the same
 * way SteerCalibrate trims the steering (`sc`). The value is persisted under
 * `setting-rc` so settings.sendAll() replays it to the car on every connect.
 */
export default function RangeCalibrateContainer(): React.JSX.Element {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('setting-rc').then((stored) => {
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
      send(`rc${next}`);
      void AsyncStorage.setItem('setting-rc', String(next));
      vibrate();
      return next;
    });
  };

  return (
    <Container>
      <RangeCalibrate angle={angle} callback={calibrate} />
    </Container>
  );
}
