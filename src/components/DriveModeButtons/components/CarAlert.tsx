import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../../../shared/protocol';
import { colors, spacing, radius, fontSize, fontWeight } from '../../../config/styles/theme';
import { MOTOR_TEMP_CUTOFF_C } from '../../../utils/gauges';

/**
 * Safety banner overlaid on the drive dashboard that tells the driver *why* the
 * car has stopped or is braking, derived from the telemetry the firmware
 * already streams:
 *   - rs1 / rs0     -> the front obstacle brake engaged / cleared
 *   - mt >= cutoff  -> the motor-temperature cutoff stopped the car
 *
 * It subscribes to the same `wsReceive` bus as the gauges and is purely an
 * overlay (`pointerEvents="none"`, absolute) — it touches none of the
 * drive-button gesture logic, so it can't interfere with control of the car.
 */
export default function CarAlert(): React.JSX.Element | null {
  const [obstacle, setObstacle] = useState(false);
  const [overheat, setOverheat] = useState(false);

  useEffect(() => {
    const id = EventRegister.addEventListener('wsReceive', (data: Telemetry) => {
      if (data.code === TELEMETRY_CODES.RANGE_SENSOR_PROBLEM) {
        setObstacle(data.value === '1');
      } else if (data.code === TELEMETRY_CODES.MOTOR_TEMP) {
        setOverheat(Number(data.value) >= MOTOR_TEMP_CUTOFF_C);
      }
    });
    return () => {
      EventRegister.removeEventListener(id as string);
    };
  }, []);

  // The motor cutoff is the more serious condition (a hard stop), so it wins if
  // both fire at once.
  const alert = overheat
    ? { text: 'MOTOR TOO HOT — CAR STOPPED', bg: colors.dangerUI }
    : obstacle
    ? { text: 'OBSTACLE AHEAD — BRAKING', bg: colors.warnUI }
    : null;

  if (!alert) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.banner, { backgroundColor: alert.bg }]}>
        <Text style={styles.text}>{alert.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  banner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  text: {
    color: colors.onAccent,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
});
