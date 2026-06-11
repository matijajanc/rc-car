import { once } from 'node:events';
import WebSocket from 'ws';
import { parseTelemetryStream } from '../../shared/protocol';
import { loadConfig, ServerConfig } from '../src/config';
import { CarLink } from '../src/link';
import { CarSimulator } from '../src/simulator';
import { Bridge, startBridge } from '../src/server';

const silent = (): void => {};

/** Config bound to an ephemeral loopback port so tests never collide. */
function testConfig(): ServerConfig {
  return { ...loadConfig({}), wsPort: 0, host: '127.0.0.1' };
}

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor timed out');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/** A deterministic in-memory car for asserting the bridge's plumbing. */
class MockLink implements CarLink {
  readonly writes: string[] = [];
  private readonly dataListeners: ((chunk: string) => void)[] = [];

  open(): Promise<void> {
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
  write(frame: string): void {
    this.writes.push(frame);
  }
  onData(listener: (chunk: string) => void): void {
    this.dataListeners.push(listener);
  }
  onError(): void {}
  onClose(): void {}

  /** Simulate the car pushing telemetry up the link. */
  pushTelemetry(chunk: string): void {
    for (const listener of this.dataListeners) {
      listener(chunk);
    }
  }
}

describe('bridge', () => {
  let bridge: Bridge | undefined;
  let client: WebSocket | undefined;

  afterEach(async () => {
    client?.close();
    if (bridge) {
      await bridge.close();
      bridge = undefined;
    }
  });

  it('forwards commands app -> car and telemetry car -> app (mock link)', async () => {
    const link = new MockLink();
    bridge = await startBridge(testConfig(), link, { logger: silent });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    // app -> car
    client.send('kp\n');
    await waitFor(() => link.writes.includes('kp\n'));
    expect(link.writes).toContain('kp\n');

    // car -> app
    const message = once(client, 'message');
    link.pushTelemetry('sp42X');
    const [data] = (await message) as [WebSocket.RawData];
    expect(data.toString()).toBe('sp42X');
  });

  it('streams simulated telemetry to a connected client with no hardware', async () => {
    const simulator = new CarSimulator({
      speedIntervalMs: 20,
      batteryIntervalMs: 1000,
      tempIntervalMs: 1000,
      logger: silent,
    });
    bridge = await startBridge(testConfig(), simulator, { logger: silent });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    const [data] = (await once(client, 'message')) as [WebSocket.RawData];
    const { items } = parseTelemetryStream(data.toString());
    expect(items.length).toBeGreaterThan(0);
    expect(['sp', 'bv', 'mt']).toContain(items[0]?.code);
  });

  it('lets the app drive the virtual car (drive command raises speed)', async () => {
    const simulator = new CarSimulator({
      speedIntervalMs: 20,
      keepAliveTimeoutMs: 0, // don't auto-stop during the test
      logger: silent,
    });
    bridge = await startBridge(testConfig(), simulator, { logger: silent });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    let maxSpeed = 0;
    client.on('message', (data: WebSocket.RawData) => {
      for (const frame of parseTelemetryStream(data.toString()).items) {
        if (frame.code === 'sp') {
          maxSpeed = Math.max(maxSpeed, Number(frame.value));
        }
      }
    });

    client.send('db\n'); // a drive-buttons press
    await waitFor(() => maxSpeed > 0);
    expect(maxSpeed).toBeGreaterThan(0);
  });

  it('reports and updates the connected client count', async () => {
    bridge = await startBridge(testConfig(), new MockLink(), { logger: silent });
    expect(bridge.clientCount()).toBe(0);

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');
    await waitFor(() => bridge!.clientCount() === 1);
    expect(bridge.clientCount()).toBe(1);
  });
});
