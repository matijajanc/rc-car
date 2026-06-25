import { CarSimulator } from '../src/simulator';

describe('simulator command logging', () => {
  it('echoes real commands but not the keep-alive heartbeat', () => {
    const messages: string[] = [];
    const sim = new CarSimulator({ logger: (m) => messages.push(m) });

    sim.write('kp\n'); // 10Hz heartbeat — must not be echoed
    sim.write('dbd\n'); // a real drive command — should be echoed
    sim.write('kp\n');

    expect(messages.some((m) => m.includes('<- dbd'))).toBe(true);
    expect(messages.some((m) => m.includes('<- kp'))).toBe(false);
  });
});

describe('simulator range-sensor telemetry', () => {
  // Keep the speed/battery/temp timers far out of the window so the only
  // frames we capture are the range-sensor ones under test.
  const quiet = { speedIntervalMs: 1e7, batteryIntervalMs: 1e7, tempIntervalMs: 1e7 };

  afterEach(() => jest.useRealTimers());

  it('emits a single rs1 when an obstacle appears and stays (edge-triggered)', () => {
    jest.useFakeTimers();
    const frames: string[] = [];
    const sim = new CarSimulator({
      ...quiet,
      random: () => 0.1, // < 0.25 → obstacle present on every roll
      rangeProblemIntervalMs: 100,
      logger: () => {},
    });
    sim.onData((c) => frames.push(c));
    void sim.open();
    jest.advanceTimersByTime(350); // three range ticks

    // Only the transition is reported, not every tick — no flood of the link.
    expect(frames.filter((f) => f.startsWith('rs'))).toEqual(['rs1X']);
    void sim.close();
  });

  it('stays silent while the path is clear', () => {
    jest.useFakeTimers();
    const frames: string[] = [];
    const sim = new CarSimulator({
      ...quiet,
      random: () => 0.9, // ≥ 0.25 → always clear
      rangeProblemIntervalMs: 100,
      logger: () => {},
    });
    sim.onData((c) => frames.push(c));
    void sim.open();
    jest.advanceTimersByTime(350);

    expect(frames.some((f) => f.startsWith('rs'))).toBe(false);
    void sim.close();
  });
});
