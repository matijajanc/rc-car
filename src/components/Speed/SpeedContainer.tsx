import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { send } from '../../utils/transmitter';
import { SPEED_FACTOR_MIN, SPEED_FACTOR_MAX } from '../../utils/gauges';
import Container from '../Common/Container/ContainerComponent';
import Speed from './components/Speed';

const SETTINGS = { minimumValue: SPEED_FACTOR_MIN, maximumValue: SPEED_FACTOR_MAX, step: 1 };

export default function SpeedContainer(): React.JSX.Element {
  const [value, setValue] = useState(120);

  useEffect(() => {
    AsyncStorage.getItem('setting-sf').then((stored) => {
      if (stored) {
        setValue(parseInt(stored, 10));
      }
    });
  }, []);

  const setSpeed = (next: number): void => {
    setValue(next);
    void AsyncStorage.setItem('setting-sf', String(next));
    send(`sf${next}`);
  };

  return (
    <Container>
      <Speed settings={SETTINGS} value={value} callback={setSpeed} />
    </Container>
  );
}
