import { once } from 'node:events';
import WebSocket from 'ws';
import { parseTelemetryStream } from '../../shared/protocol';
import { loadConfig, ServerConfig } from '../src/config';
import { CarLink } from '../src/link';
import { Logger } from '../src/logger';
import { CarSimulator } from '../src/simulator';
import { Bridge, startBridge } from '../src/server';

/** Quiet logger for tests: no console output, no files. */
const quietLogger = (): Logger => new Logger({ dir: null, toConsole: false });
const silent = (): void => {};

/** Config bound to an ephemeral loopback port; no log files in tests. */
function testConfig(): ServerConfig {
  return { ...loadConfig({}), wsPort: 0, host: '127.0.0.1', logDir: null };
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
    bridge = await startBridge(testConfig(), link, { logger: quietLogger() });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    // app -> car
    client.send('dvfc\n');
    await waitFor(() => link.writes.includes('dvfc\n'));
    expect(link.writes).toContain('dvfc\n');

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
    bridge = await startBridge(testConfig(), simulator, { logger: quietLogger() });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    const [data] = (await once(client, 'message')) as [WebSocket.RawData];
    const { items } = parseTelemetryStream(data.toString());
    expect(items.length).toBeGreaterThan(0);
    expect(['sp', 'bv', 'mt']).toContain(items[0]?.code);
  });

  it('lets the app drive the virtual car (drive state raises speed)', async () => {
    const simulator = new CarSimulator({
      speedIntervalMs: 20,
      motionLeaseMs: 0, // don't coast during the test
      logger: silent,
    });
    bridge = await startBridge(testConfig(), simulator, { logger: quietLogger() });

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

    client.send('dvfc80\n'); // forward + straight at level 80
    await waitFor(() => maxSpeed > 0);
    expect(maxSpeed).toBeGreaterThan(0);
  });

  it('sends one explicit stop to the car when the last app disconnects', async () => {
    const link = new MockLink();
    bridge = await startBridge(testConfig(), link, { logger: quietLogger() });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');
    client.close();
    await waitFor(() => link.writes.includes('st\n'));
    expect(link.writes.filter((w) => w === 'st\n')).toHaveLength(1);
  });

  it('survives a car-link write failure (frame dropped, bridge stays up)', async () => {
    // A serial port that is unplugged/mid-reconnect throws on write; the bridge
    // must drop the frame (the car coasts out its motion lease) — not crash.
    const link = new (class extends MockLink {
      write(): void {
        throw new Error('port not open');
      }
    })();
    const logger = quietLogger();
    bridge = await startBridge(testConfig(), link, { logger });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');
    client.send('dvfc\n');
    await waitFor(() => logger.recent().some((e) => e.event === 'write_failed'));

    // Still serving: the write failure was contained.
    const health = await fetch(`http://127.0.0.1:${bridge.port}/health`);
    expect(health.status).toBe(200);
  });

  it('reports and updates the connected client count', async () => {
    bridge = await startBridge(testConfig(), new MockLink(), { logger: quietLogger() });
    expect(bridge.clientCount()).toBe(0);

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');
    await waitFor(() => bridge!.clientCount() === 1);
    expect(bridge.clientCount()).toBe(1);
  });

  it('verbose mode traces decoded commands (per client) and telemetry', async () => {
    const link = new MockLink();
    const logger = new Logger({ dir: null, toConsole: false, level: 'debug' });
    bridge = await startBridge(testConfig(), link, { logger, verbose: true });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    // app -> car: a real command is traced with its decoded name and client id.
    client.send('cl1\n');
    await waitFor(() => logger.recent().some((e) => e.event === 'app_to_car' && e.code === 'cl'));
    const cmd = logger.recent().find((e) => e.event === 'app_to_car' && e.code === 'cl');
    expect(cmd?.value).toBe('1');
    expect(typeof cmd?.client).toBe('string');
    expect(String(cmd?.client)).toMatch(/^#\d+ /); // "#1 <ip>:<port>"

    // car -> app: telemetry is traced too, with its decoded code.
    link.pushTelemetry('bv550X');
    await waitFor(() => logger.recent().some((e) => e.event === 'car_to_app' && e.code === 'bv'));
    const tel = logger.recent().find((e) => e.event === 'car_to_app' && e.code === 'bv');
    expect(tel?.value).toBe('550');
  });

  it('verbose mode collapses repeated identical telemetry frames', async () => {
    const link = new MockLink();
    const logger = new Logger({ dir: null, toConsole: false, level: 'debug' });
    bridge = await startBridge(testConfig(), link, { logger, verbose: true });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    link.pushTelemetry('sp0X'); // logged
    link.pushTelemetry('sp0X'); // identical -> suppressed
    link.pushTelemetry('sp0X'); // identical -> suppressed
    link.pushTelemetry('sp5X'); // value changed -> logged again

    const speeds = logger
      .recent()
      .filter((e) => e.event === 'car_to_app' && e.code === 'sp')
      .map((e) => e.value);
    expect(speeds).toEqual(['0', '5']);
  });

  it('does not trace per-frame when verbose is off', async () => {
    const link = new MockLink();
    const logger = new Logger({ dir: null, toConsole: false, level: 'debug' });
    bridge = await startBridge(testConfig(), link, { logger });

    client = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
    await once(client, 'open');

    client.send('cl1\n');
    await waitFor(() => link.writes.includes('cl1\n'));
    expect(logger.recent().some((e) => e.event === 'app_to_car')).toBe(false);
  });

  it('serves /health and /logs over HTTP on the same port', async () => {
    bridge = await startBridge(testConfig(), new MockLink(), { logger: quietLogger() });
    const base = `http://127.0.0.1:${bridge.port}`;

    const health = await fetch(`${base}/health`);
    expect(health.status).toBe(200);
    const body = (await health.json()) as { status: string; clients: number };
    expect(body.status).toBe('ok');
    expect(typeof body.clients).toBe('number');

    const logs = await fetch(`${base}/logs?limit=50`);
    expect(logs.status).toBe(200);
    const entries = (await logs.json()) as { event: string }[];
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.some((e) => e.event === 'listening')).toBe(true);
  });
});
