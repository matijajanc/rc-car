/**
 * Pure throttle math for the drive touchpad (no React Native imports, so it is
 * unit-testable). Turns a finger position into an absolute throttle command.
 */
import {
  DRIVE_LEVEL_MAX,
  DRIVE_LEVEL_MIN,
  DRIVE_LEVEL_STEP,
  DRIVE_THROTTLE,
} from '../../shared/protocol';
import type { ThrottleState } from '../../shared/protocol';

/** Top fraction of the pad used for (variable) forward; the rest is reverse. */
export const FORWARD_FRACTION = 0.75;
/** Neutral deadband straddling the boundary, as a fraction of pad height. */
export const DEADBAND_FRACTION = 0.03;
/**
 * Expo exponent (>1 = extra-fine control at the low end, which is what makes
 * launches gentle). Bench-tunable; positionToLevel is the only consumer.
 */
export const THROTTLE_GAMMA = 1.6;

/** Map a forward-zone position in [0,1] to a quantized throttle level [0,100]. */
export function positionToLevel(pos: number, gamma: number = THROTTLE_GAMMA): number {
  const clamped = Math.min(1, Math.max(0, pos));
  const curved = Math.pow(clamped, gamma) * DRIVE_LEVEL_MAX;
  const stepped = Math.round(curved / DRIVE_LEVEL_STEP) * DRIVE_LEVEL_STEP;
  return Math.min(DRIVE_LEVEL_MAX, Math.max(DRIVE_LEVEL_MIN, stepped));
}

export interface ThrottleResolution {
  throttle: ThrottleState;
  /** Forward level 0..100; 0 for neutral and reverse. */
  level: number;
}

/**
 * Resolve a touch Y (points; 0 = top of the pad) and the pad height into an
 * absolute throttle: top FORWARD_FRACTION = variable forward, the bottom =
 * fixed reverse, with a DEADBAND_FRACTION neutral band at the boundary.
 */
export function resolveThrottle(y: number, height: number): ThrottleResolution {
  if (height <= 0) {
    return { throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 };
  }
  const cy = Math.min(height, Math.max(0, y));
  const neutralY = FORWARD_FRACTION * height;
  const dead = DEADBAND_FRACTION * height;
  if (cy < neutralY - dead) {
    return { throttle: DRIVE_THROTTLE.FORWARD, level: positionToLevel((neutralY - cy) / neutralY) };
  }
  if (cy > neutralY + dead) {
    return { throttle: DRIVE_THROTTLE.REVERSE, level: 0 };
  }
  return { throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 };
}
