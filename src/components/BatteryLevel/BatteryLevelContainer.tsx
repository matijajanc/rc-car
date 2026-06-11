import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../../shared/protocol';
import { colors } from '../../config/styles/colors';

// Raw ADC units from the firmware: MAX 16.8V => 675, MIN 12.8V => 435.
function toPercent(raw: number): number {
  if (!raw) {
    return 0;
  }
  return Math.max(0, Math.min(100, (raw - 435) / ((675 - 435) / 100)));
}

function colorFor(pct: number): string {
  if (pct < 20) {
    return colors.red;
  }
  if (pct < 60) {
    return colors.orange;
  }
  return colors.green;
}

export default function BatteryLevelContainer(): React.JSX.Element {
  const [voltage, setVoltage] = useState(0);

  useEffect(() => {
    const id = EventRegister.addEventListener('wsReceive', (data: Telemetry) => {
      if (data.code === TELEMETRY_CODES.BATTERY_VOLTAGE) {
        setVoltage(Number(data.value));
      }
    });
    return () => {
      EventRegister.removeEventListener(id as string);
    };
  }, []);

  const pct = toPercent(voltage);

  return (
    <View style={styles.box}>
      <AnimatedCircularProgress
        size={84}
        width={6}
        fill={pct}
        tintColor={colorFor(pct)}
        backgroundColor="#222">
        {() => <Text style={styles.value}>{`${Math.round(pct)}%`}</Text>}
      </AnimatedCircularProgress>
      <Text style={styles.label}>Battery</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', margin: 10 },
  value: { color: '#fff', fontSize: 18 },
  label: { color: '#fff', fontSize: 12, marginTop: 4 },
});
