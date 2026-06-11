import React, { useEffect, useState } from 'react';
import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../../shared/protocol';
import Speedometer from './components/Speedometer';

interface Props {
  navigate: (route: string) => void;
}

export default function SpeedometerContainer({ navigate }: Props): React.JSX.Element {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const id = EventRegister.addEventListener('wsReceive', (data: Telemetry) => {
      if (data.code === TELEMETRY_CODES.SPEED) {
        setSpeed(Number(data.value));
      }
    });
    return () => {
      EventRegister.removeEventListener(id as string);
    };
  }, []);

  return <Speedometer speed={speed} navigate={navigate} />;
}
