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
