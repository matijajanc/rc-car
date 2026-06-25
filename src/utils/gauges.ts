/**
 * Pure gauge math (no React Native imports) so it is easy to unit-test.
 * Shared by the Battery and Motor dashboard gauges.
 */

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Battery raw ADC units -> %. Firmware: MAX 16.8V => 675, MIN 12.8V => 435. */
export function batteryPercent(voltage: number): number {
  if (!voltage) {
    return 0;
  }
  return clampPercent((voltage - 435) / ((675 - 435) / 100));
}

/** How many of `total` arc segments are lit for a 0..100 fill level. */
export function segmentsLit(fillLevel: number, total: number): number {
  return Math.floor((total * clampPercent(fillLevel)) / 100);
}

export type Zone = 0 | 1 | 2;

/** Battery charge zone: 0 = critical (<20%), 1 = low (<60%), 2 = healthy. */
export function batteryZone(pct: number): Zone {
  return pct < 20 ? 0 : pct < 60 ? 1 : 2;
}

/** Motor temperature zone: 0 = cool (<40), 1 = warm (<80), 2 = hot. */
export function motorZone(temp: number): Zone {
  return temp < 40 ? 0 : temp < 80 ? 1 : 2;
}

/**
 * Motor-temperature cutoff (°C). The firmware stops the car at this temperature
 * (`criticalTemp` in arduino/rc-car/rc-car.ino) — keep the two in sync. Used by
 * the drive-dashboard safety banner to explain why the car stopped.
 */
export const MOTOR_TEMP_CUTOFF_C = 50;
