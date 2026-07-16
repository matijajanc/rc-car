import { DRIVE_THROTTLE } from '../shared/protocol';
import {
  positionToLevel,
  resolveThrottle,
  FORWARD_FRACTION,
  DEADBAND_FRACTION,
} from '../src/utils/throttle-curve';

describe('positionToLevel', () => {
  it('maps the endpoints exactly', () => {
    expect(positionToLevel(0)).toBe(0);
    expect(positionToLevel(1)).toBe(100);
  });

  it('clamps out-of-range positions', () => {
    expect(positionToLevel(-1)).toBe(0);
    expect(positionToLevel(2)).toBe(100);
  });

  it('always returns a multiple of the 5% step', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(positionToLevel(p) % 5).toBe(0);
    }
  });

  it('is monotonic non-decreasing', () => {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const lvl = positionToLevel(p);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it('is sub-linear at the low end (gentle launch)', () => {
    // Expo curve: half travel yields well under half throttle.
    expect(positionToLevel(0.5)).toBeGreaterThan(0);
    expect(positionToLevel(0.5)).toBeLessThan(50);
  });
});

describe('resolveThrottle', () => {
  const H = 300; // px; neutral line at 0.75*H = 225, deadband +/- 9

  it('top of the pad is full forward', () => {
    expect(resolveThrottle(0, H)).toEqual({ throttle: DRIVE_THROTTLE.FORWARD, level: 100 });
  });

  it('the neutral band around the boundary is neutral', () => {
    expect(resolveThrottle(FORWARD_FRACTION * H, H).throttle).toBe(DRIVE_THROTTLE.NEUTRAL);
  });

  it('below the reverse boundary is fixed reverse', () => {
    expect(resolveThrottle(H, H)).toEqual({ throttle: DRIVE_THROTTLE.REVERSE, level: 0 });
  });

  it('a point inside the forward zone is proportional forward', () => {
    const res = resolveThrottle(150, H); // pos = (225-150)/225 = 0.333...
    expect(res.throttle).toBe(DRIVE_THROTTLE.FORWARD);
    expect(res.level).toBeGreaterThan(0);
    expect(res.level).toBeLessThan(100);
  });

  it('a zero height is treated as neutral', () => {
    expect(resolveThrottle(10, 0).throttle).toBe(DRIVE_THROTTLE.NEUTRAL);
  });

  it('exposes the layout fractions used by the pad visual', () => {
    expect([FORWARD_FRACTION, DEADBAND_FRACTION]).toEqual([0.75, 0.03]);
  });
});
