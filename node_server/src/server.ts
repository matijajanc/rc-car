import { once } from 'node:events';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { ServerConfig } from './config';
import { CarLink } from './link';
import { Logger, LogLevel } from './logger';

export interface BridgeOptions {
  logger?: Logger;
}

export interface Bridge {
  /** The port the server actually bound to (WebSocket + HTTP share it). */
  readonly port: number;
  /** Number of currently connected app clients. */
  clientCount(): number;
  /** Stop accepting clients, disconnect everyone, and close the car link. */
  close(): Promise<void>;
}

/** Warn if no telemetry arrives for this long while an app is connected. */
const TELEMETRY_GAP_MS = 3000;
const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

/** ws delivers messages as Buffer | ArrayBuffer | Buffer[]; normalise to text. */
function rawDataToString(data: RawData): string {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString();
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString();
  }
  return data.toString();
}

/**
 * Wires a {@link CarLink} (real serial port or simulator) to a WebSocket
 * server, and exposes a small HTTP API (GET /health, GET /logs) on the same
 * port for observability. Telemetry from the car is broadcast to every
 * connected app; commands from any app are written to the car. Every notable
 * event on both legs (app↔server, server↔car) is logged with a timestamp.
 */
export async function startBridge(
  config: ServerConfig,
  link: CarLink,
  options: BridgeOptions = {},
): Promise<Bridge> {
  const log = options.logger ?? new Logger({ level: config.logLevel, dir: config.logDir });

  const startedAt = Date.now();
  let lastDataAt = Date.now();
  let gapWarned = false;

  await link.open();
  log.info('server', 'link_open', { simulate: config.simulate });

  const httpServer = createServer((req, res) => handleHttp(req, res));
  const wss = new WebSocketServer({ server: httpServer });

  function handleHttp(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      const body = {
        status: 'ok',
        simulate: config.simulate,
        clients: wss.clients.size,
        lastTelemetryAt: new Date(lastDataAt).toISOString(),
        telemetryAgeMs: Date.now() - lastDataAt,
        uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/logs') {
      const limit = Number.parseInt(url.searchParams.get('limit') ?? '200', 10) || 200;
      const levelParam = url.searchParams.get('level') ?? undefined;
      const minLevel = LOG_LEVELS.find((l) => l === levelParam);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(log.recent(limit, minLevel), null, 2));
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
  }

  // Car -> apps: broadcast every telemetry chunk; track liveness for gap detection.
  link.onData((chunk) => {
    lastDataAt = Date.now();
    if (gapWarned) {
      gapWarned = false;
      log.info('serial', 'telemetry_resumed');
    }
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(chunk);
      }
    }
  });
  link.onError((error) => log.error('serial', 'link_error', { msg: error.message }));
  link.onClose(() => log.warn('serial', 'link_closed', { msg: 'car link closed' }));

  // Apps -> car: forward every message verbatim to the car link.
  wss.on('connection', (client, req) => {
    const ip = req.socket.remoteAddress ?? 'unknown';
    log.info('ws', 'client_connected', { ip, clients: wss.clients.size });
    client.on('message', (data) => link.write(rawDataToString(data)));
    client.on('error', (error) => log.warn('ws', 'client_error', { ip, msg: error.message }));
    client.on('close', (code: number, reason: Buffer) =>
      log.info('ws', 'client_disconnected', {
        ip,
        code,
        reason: reason.toString(),
        clients: wss.clients.size,
      }),
    );
  });
  wss.on('error', (error) => log.error('ws', 'server_error', { msg: error.message }));

  // Watchdog: car↔server leg. If telemetry stops while someone is driving,
  // the car is probably off/unplugged — record when it happened.
  const gapTimer = setInterval(() => {
    const age = Date.now() - lastDataAt;
    if (wss.clients.size > 0 && !gapWarned && age > TELEMETRY_GAP_MS) {
      gapWarned = true;
      log.warn('serial', 'telemetry_gap', {
        sinceMs: age,
        msg: 'no telemetry from car — off, unplugged, or serial down?',
      });
    }
  }, 1000);
  gapTimer.unref?.();

  httpServer.listen(config.wsPort, config.host);
  await once(httpServer, 'listening');
  const port = (httpServer.address() as AddressInfo).port;
  log.info('ws', 'listening', { host: config.host, port, simulate: config.simulate });

  return {
    port,
    clientCount: () => wss.clients.size,
    close: async () => {
      clearInterval(gapTimer);
      for (const client of wss.clients) {
        client.terminate();
      }
      await new Promise<void>((resolve, reject) => {
        wss.close((error) => (error ? reject(error) : resolve()));
      });
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await link.close();
      log.info('server', 'closed');
    },
  };
}
