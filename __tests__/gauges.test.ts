import {
  batteryPercent,
  batteryZone,
  clampPercent,
  motorZone,
  segmentsLit,
  speedFactorToKmh,
} from '../src/utils/gauges';

describe('gauge math', () => {
  it('maps battery voltage units to percent', () => {
    expect(batteryPercent(0)).toBe(0);
    expect(batteryPercent(435)).toBe(0);
    expect(batteryPercent(675)).toBe(100);
    expect(batteryPercent(555)).toBe(50);
  });

  it('clamps out-of-range battery voltage', () => {
    expect(batteryPercent(400)).toBe(0); // below min
    expect(batteryPercent(800)).toBe(100); // above max
  });

  it('lights the right number of arc segments', () => {
    expect(segmentsLit(0, 39)).toBe(0);
    expect(segmentsLit(100, 39)).toBe(39);
    expect(segmentsLit(50, 40)).toBe(20);
  });

  it('classifies battery zones (red <20, orange <60, green)', () => {
    expect(batteryZone(10)).toBe(0);
    expect(batteryZone(20)).toBe(1);
    expect(batteryZone(59)).toBe(1);
    expect(batteryZone(60)).toBe(2);
  });

  it('classifies motor zones (green <40, orange <80, red)', () => {
    expect(motorZone(39)).toBe(0);
    expect(motorZone(40)).toBe(1);
    expect(motorZone(80)).toBe(2);
  });

  it('clampPercent bounds to 0..100', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(42)).toBe(42);
  });

  it('maps the speed factor to km/h (95→5, 165→45, linear between)', () => {
    expect(speedFactorToKmh(95)).toBe(5);
    expect(speedFactorToKmh(165)).toBe(45);
    expect(speedFactorToKmh(130)).toBe(25); // midpoint
    expect(speedFactorToKmh(120)).toBe(19); // 19.28 rounded
  });

  it('clamps speed factors outside the slider range', () => {
    expect(speedFactorToKmh(50)).toBe(5);
    expect(speedFactorToKmh(200)).toBe(45);
  });
});
