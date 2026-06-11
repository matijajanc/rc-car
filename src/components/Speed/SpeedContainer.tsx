import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { send } from '../../utils/transmitter';
import Container from '../Common/Container/ContainerComponent';
import Speed from './components/Speed';

const SETTINGS = { minimumValue: 95, maximumValue: 165, step: 1 };

export default function SpeedContainer(): React.JSX.Element {
  const [value, setValue] = useState(120);

  useEffect(() => {
    AsyncStorage.getItem('setting-sp').then((stored) => {
      if (stored) {
        setValue(parseInt(stored, 10));
      }
    });
  }, []);

  const setSpeed = (next: number): void => {
    setValue(next);
    void AsyncStorage.setItem('setting-sp', String(next));
    // NOTE: the legacy app sends 'sp' for the speed setting; see the firmware
    // discrepancy note in ANDROID_UPGRADE.md §4.3 ('sp' vs 'sf').
    send(`sp${next}`);
  };

  return (
    <Container>
      <Speed settings={SETTINGS} value={value} callback={setSpeed} />
    </Container>
  );
}
