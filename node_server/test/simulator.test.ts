import { CarSimulator } from '../src/simulator';

describe('simulator command logging', () => {
  it('echoes state changes but coalesces the drive-state refresh stream', () => {
    const messages: string[] = [];
    const sim = new CarSimulator({ logger: (m) => messages.push(m) });

    sim.write('dvfc\n'); // press forward — echoed
    sim.write('dvfc\n'); // refresh of the same state — suppressed
    sim.write('dvfc\n'); // refresh — suppressed
    sim.write('dvnc\n'); // release — echoed

    expect(messages.filter((m) => m.includes('<- dvfc'))).toHaveLength(1);
    expect(messages.filter((m) => m.includes('<- dvnc'))).toHaveLength(1);
  });
});

describe('simulator motion lease', () => {
  // Keep the battery/temp/range timers far out of the window so the only
  // frames we capture are the speed ones under test.
  const quiet = {
    batteryIntervalMs: 1e7,
    tempIntervalMs: 1e7,
    rangeProblemIntervalMs: 0,
    logger: () => {},
  };

  afterEach(() => jest.useRealTimers());

  const lastSpeed = (frames: string[]): string | undefined =>
    frames.filter((f) => f.startsWith('sp')).pop();

  it('drives while dv frames stay fresh, coasts to 0 when they stop', () => {
    jest.useFakeTimers();
    const frames: string[] = [];
    const sim = new CarSimulator({ ...quiet, speedIntervalMs: 100 });
    sim.onData((c) => frames.push(c));
    void sim.open();

    // Hold forward, refreshing well inside the 600ms lease.
    for (let i = 0; i < 6; i += 1) {
      sim.write('dvfc\n');
      jest.advanceTimersByTime(100);
    }
    expect(lastSpeed(frames)).not.toBe('sp0X');

    // Stop refreshing: the lease expires and the car coasts down to 0.
    jest.advanceTimersByTime(1500);
    expect(lastSpeed(frames)).toBe('sp0X');
    void sim.close();
  });

  it('stops immediately on an explicit st', () => {
    jest.useFakeTimers();
    const frames: string[] = [];
    const sim = new CarSimulator({ ...quiet, speedIntervalMs: 100 });
    sim.onData((c) => frames.push(c));
    void sim.open();

    sim.write('dvfc\n');
    jest.advanceTimersByTime(300);
    sim.write('st\n');
    jest.advanceTimersByTime(100);
    expect(lastSpeed(frames)).toBe('sp0X');
    void sim.close();
  });

  it('a malformed dv frame does not extend the lease', () => {
    jest.useFakeTimers();
    const frames: string[] = [];
    const sim = new CarSimulator({ ...quiet, speedIntervalMs: 100 });
    sim.onData((c) => frames.push(c));
    void sim.open();

    sim.write('dvfc\n');
    // Keep sending garbage past the lease window — it must not keep the car alive.
    for (let i = 0; i < 12; i += 1) {
      sim.write('dvzz\n');
      jest.advanceTimersByTime(100);
    }
    expect(lastSpeed(frames)).toBe('sp0X');
    void sim.close();
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
