import { once } from 'node:events';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import {
  CODE_LENGTH,
  COMMAND_CODES,
  commandName,
  frameCommand,
  parseCommandStream,
  parseTelemetryStream,
  telemetryName,
} from '../../shared/protocol';
import { ServerConfig } from './config';
import { CarLink } from './link';
import { Logger, LogLevel } from './logger';

export interface BridgeOptions {
  logger?: Logger;
  /**
   * Trace every frame on both legs at debug level: each app->car command
   * (labelled with which client sent it) and each car->app telemetry frame,
   * decoded to its human-readable name. Off by default.
   */
  verbose?: boolean;
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

/**
 * The drive state ('dv') is re-asserted a few times a second while a control is
 * held. In verbose mode we log a command only when its value CHANGES, plus a
 * summary line per this window while it repeats, so the refresh stream doesn't
 * bury real events.
 */
const REPEAT_LOG_INTERVAL_MS = 2000;

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
  const verbose = options.verbose ?? config.verbose;

  const startedAt = Date.now();
  let lastDataAt = Date.now();
  let gapWarned = false;

  // Monotonic id per connection so verbose logs say which app sent each command.
  let clientSeq = 0;

  // Verbose car->app tracing. Telemetry can split across chunks, so we buffer
  // the tail between calls exactly like the app's receiver does.
  let telemetryRest = '';
  // Last value logged per telemetry code, so steady-state repeats (e.g. sp0
  // every 500ms while parked) collapse to one line until the value changes.
  const lastTelemetry = new Map<string, string>();
  function traceTelemetry(chunk: string): void {
    const { items, rest } = parseTelemetryStream(telemetryRest + chunk);
    telemetryRest = rest;
    for (const { code, value } of items) {
      if (lastTelemetry.get(code) === value) {
        continue;
      }
      lastTelemetry.set(code, value);
      log.debug('serial', 'car_to_app', {
        msg: `car -> apps   ${code}${value}  (${telemetryName(code) ?? 'unknown'})`,
        code,
        value,
      });
    }
  }

  await link.open();
  log.info('server', 'link_open', { simulate: config.simulate });

  // The serial link can be down/reopening at any moment (car off, cable out,
  // mid-reconnect) and its write() may throw. A crashed bridge is strictly
  // worse than a dropped frame — the car's own motion lease coasts it to
  // neutral within ~600ms when frames stop — so drop-and-warn (throttled)
  // instead of letting a relay write take the process down.
  let writeWarnedAt = 0;
  function writeToCar(frame: string): void {
    try {
      link.write(frame);
    } catch (error) {
      const now = Date.now();
      if (now - writeWarnedAt > 5000) {
        writeWarnedAt = now;
        log.warn('serial', 'write_failed', {
          msg: `dropping frames — car link unavailable (${(error as Error).message})`,
        });
      }
    }
  }

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
    if (verbose) {
      traceTelemetry(chunk);
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
    // A stable label per connection: #1 192.168.1.5:54213. The port
    // disambiguates two apps behind the same IP (NAT / phone + emulator).
    const clientId = `#${++clientSeq} ${ip}:${req.socket.remotePort ?? '?'}`;
    log.info('ws', 'client_connected', { client: clientId, ip, clients: wss.clients.size });

    // Per-connection verbose state: a partial-frame buffer plus repeat
    // coalescing, all naturally torn down when this closure goes out of scope.
    let cmdRest = '';
    let lastCmdBody = '';
    let cmdRepeats = 0;
    let repeatLoggedAt = 0;

    client.on('message', (data) => {
      const raw = rawDataToString(data);
      if (verbose) {
        traceCommands(clientId, raw);
      }
      writeToCar(raw);
    });

    /**
     * Decode and log each command in `raw`. A command identical to the previous
     * one (the dv refresh stream re-asserting a held control) is coalesced into
     * a periodic "xN" summary so state CHANGES stay easy to spot.
     */
    function traceCommands(who: string, raw: string): void {
      const { items, rest } = parseCommandStream(cmdRest + raw);
      cmdRest = rest;
      for (const body of items) {
        const code = body.slice(0, CODE_LENGTH);
        const value = body.slice(CODE_LENGTH);
        if (body === lastCmdBody) {
          cmdRepeats += 1;
          const now = Date.now();
          if (now - repeatLoggedAt >= REPEAT_LOG_INTERVAL_MS) {
            log.debug('ws', 'app_to_car', {
              msg: `${who} -> car   ${body}  (${commandName(code) ?? 'unknown'} x${cmdRepeats})`,
              client: who,
              code,
              value,
              count: cmdRepeats,
            });
            repeatLoggedAt = now;
            cmdRepeats = 0;
          }
          continue;
        }
        lastCmdBody = body;
        cmdRepeats = 0;
        repeatLoggedAt = Date.now();
        log.debug('ws', 'app_to_car', {
          msg: `${who} -> car   ${code}${value}  (${commandName(code) ?? 'unknown'})`,
          client: who,
          code,
          value,
        });
      }
    }

    client.on('error', (error) =>
      log.warn('ws', 'client_error', { client: clientId, ip, msg: error.message }),
    );
    client.on('close', (code: number, reason: Buffer) => {
      log.info('ws', 'client_disconnected', {
        client: clientId,
        ip,
        code,
        reason: reason.toString(),
        clients: wss.clients.size,
      });
      // Nobody is controlling the car any more — stop it now rather than
      // waiting out the motion lease. Event-driven (an actual socket close),
      // never inferred: this is the only place the bridge speaks for the app.
      if (wss.clients.size === 0) {
        writeToCar(frameCommand(COMMAND_CODES.STOP));
        log.info('server', 'car_stopped', {
          msg: 'last app disconnected — sent explicit stop',
        });
      }
    });
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
      // Deliberate shutdown: stop the car immediately instead of leaving it to
      // coast out its motion lease.
      writeToCar(frameCommand(COMMAND_CODES.STOP));
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
