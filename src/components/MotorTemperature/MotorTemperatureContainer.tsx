import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../../shared/protocol';
import { colors } from '../../config/styles/colors';

function colorFor(temp: number): string {
  if (temp < 40) {
    return colors.green;
  }
  if (temp < 80) {
    return colors.orange;
  }
  return colors.red;
}

export default function MotorTemperatureContainer(): React.JSX.Element {
  const [temperature, setTemperature] = useState(0);

  useEffect(() => {
    const id = EventRegister.addEventListener('wsReceive', (data: Telemetry) => {
      if (data.code === TELEMETRY_CODES.MOTOR_TEMP) {
        setTemperature(Number(data.value));
      }
    });
    return () => {
      EventRegister.removeEventListener(id as string);
    };
  }, []);

  const pct = Math.max(0, Math.min(100, temperature));

  return (
    <View style={styles.box}>
      <AnimatedCircularProgress
        size={84}
        width={6}
        fill={pct}
        tintColor={colorFor(temperature)}
        backgroundColor="#222">
        {() => <Text style={styles.value}>{`${Math.round(temperature)}°`}</Text>}
      </AnimatedCircularProgress>
      <Text style={styles.label}>Motor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', margin: 10 },
  value: { color: '#fff', fontSize: 18 },
  label: { color: '#fff', fontSize: 12, marginTop: 4 },
});
