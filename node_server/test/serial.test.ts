import { PortFactory, SerialCarLink } from '../src/serial';

/** A controllable fake serial port for testing the reconnect logic. */
class FakePort {
  readonly listeners: Record<string, Array<(arg?: unknown) => void>> = {};
  openError: Error | null = null;

  on(event: string, listener: (arg?: unknown) => void): void {
    const arr = this.listeners[event] ?? (this.listeners[event] = []);
    arr.push(listener);
  }
  open(callback: (error: Error | null) => void): void {
    callback(this.openError);
  }
  close(callback: () => void): void {
    callback();
  }
  write(_data: string, callback: (error: null) => void): void {
    callback(null);
  }
  fireClose(): void {
    (this.listeners.close ?? []).forEach((listener) => listener());
  }
}

describe('SerialCarLink auto-reconnect', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reconnects after an unexpected disconnect', async () => {
    const ports: FakePort[] = [];
    const events: string[] = [];
    const factory = (async () => {
      const port = new FakePort();
      ports.push(port);
      return port;
    }) as unknown as PortFactory;

    const link = new SerialCarLink({
      path: '/dev/fake',
      baudRate: 19200,
      portFactory: factory,
      reconnectBaseMs: 10,
      reconnectMaxMs: 50,
      logger: (event) => events.push(event),
    });

    await link.open();
    expect(ports).toHaveLength(1);

    ports[0]?.fireClose(); // cable yanked
    expect(events).toContain('reconnect_scheduled');

    await jest.advanceTimersByTimeAsync(15);
    expect(ports.length).toBeGreaterThanOrEqual(2);
    expect(events).toContain('reconnected');

    await link.close();
  });

  it('starts even if the car is not connected yet, then reconnects', async () => {
    const ports: FakePort[] = [];
    const factory = (async () => {
      const port = new FakePort();
      if (ports.length === 0) {
        port.openError = new Error('no device');
      }
      ports.push(port);
      return port;
    }) as unknown as PortFactory;

    const link = new SerialCarLink({
      path: '/dev/fake',
      baudRate: 19200,
      portFactory: factory,
      reconnectBaseMs: 10,
      reconnectMaxMs: 50,
    });

    await expect(link.open()).resolves.toBeUndefined(); // does NOT throw
    expect(ports).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(15);
    expect(ports.length).toBeGreaterThanOrEqual(2); // retried; second port opens

    await link.close();
  });
});
