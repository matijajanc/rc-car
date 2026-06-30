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
  /**
   * Override the keep-alive timings. Tests only — production uses the fixed
   * {@link KEEP_ALIVE} defaults; nothing reads these from the environment.
   */
  timings?: Partial<KeepAliveTimings>;
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
 * Keep-alive ('kp') is a 10Hz heartbeat. In verbose mode we coalesce it to at
 * most one line per client per this window so it doesn't bury real commands.
 */
const KEEP_ALIVE_LOG_INTERVAL_MS = 2000;

/** Server-authoritative keep-alive timings (ms). See {@link KEEP_ALIVE}. */
interface KeepAliveTimings {
  /** How often the bridge emits 'kp' to the car. Must stay well under ~300ms. */
  intervalMs: number;
  /** How often the bridge pings each app to probe the transport. */
  pingIntervalMs: number;
  /**
   * No pong AND no message (drive cmd / presence beat) within this window =
   * transport blackout → stop the car. Sized to ride out brief (~0.7s) Wi-Fi /
   * phone hiccups, not just a hard disconnect; a sustained real disconnect stops
   * in ~this + the firmware's 300ms dead-man.
   */
  pongTimeoutMs: number;
  /** No message within this window = app gone/suspended → stop the car. */
  presenceTimeoutMs: number;
}

/**
 * Fixed in code on purpose: the car safety-stops if it misses keep-alives for
 * ~300ms, so these are tuned together against that hardware window and the WS
 * ping/pong handshake — not per-deploy knobs. (Tests can override via
 * BridgeOptions.timings; nothing reads them from the environment.)
 */
const KEEP_ALIVE: KeepAliveTimings = {
  intervalMs: 100,
  pingIntervalMs: 300,
  // 1500ms (was 700): bench-measured brief Wi-Fi/phone blackouts hit ~700ms and
  // false-tripped the old window while the link was actually fine. The pong is
  // native (it survives a blocked JS thread — bench-confirmed), so this window
  // only needs to ride out transient blackouts, NOT JS jank; presenceTimeoutMs
  // handles a gone/frozen app, and the firmware's 300ms dead-man is the backstop.
  pongTimeoutMs: 1500,
  presenceTimeoutMs: 2000,
};

/**
 * Per-connection liveness state, tracked outside the connection closure so the
 * keep-alive generator and ping watchdog can reason about every client at once.
 */
interface ClientState {
  /** Stable "#n ip:port" label for logs. */
  id: string;
  /** When we last received a pong (transport alive). Seeded at connect. */
  lastPongAt: number;
  /** When the app last sent us anything (app present). Seeded at connect. */
  lastSeenAt: number;
}

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
  const timings: KeepAliveTimings = { ...KEEP_ALIVE, ...options.timings };

  // Per-client liveness/latency state, keyed by the socket. The keep-alive
  // generator and ping watchdog below iterate this to decide whether the car
  // should stay armed.
  const clientState = new Map<WebSocket, ClientState>();
  // True while the car is being kept alive (we have ≥1 live client). Tracked so
  // the generator sends exactly one explicit stop on the live→dead edge.
  let carArmed = false;

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

    // Seed the liveness clocks to "now" so a just-connected client is treated as
    // alive + present immediately — it arms the car on the next generator tick,
    // before it has sent anything or answered its first ping.
    const connectedAt = Date.now();
    clientState.set(client, {
      id: clientId,
      lastPongAt: connectedAt,
      lastSeenAt: connectedAt,
    });

    // Per-connection verbose state: a partial-frame buffer plus keep-alive
    // coalescing, both naturally torn down when this closure goes out of scope.
    let cmdRest = '';
    let kpSince = 0;
    let kpLoggedAt = 0;

    client.on('message', (data) => {
      const raw = rawDataToString(data);
      // Any inbound frame proves the app is present — a drive command, a
      // setting, or its relaxed presence beat — so refresh the presence clock.
      const state = clientState.get(client);
      if (state) {
        state.lastSeenAt = Date.now();
      }
      if (verbose) {
        traceCommands(clientId, raw);
      }
      // Forward verbatim to the car. The app's own 'kp' beat is relayed too;
      // it's harmless (just restarts the firmware timer) — the authoritative
      // 100ms keep-alive is generated below, independent of the JS thread.
      link.write(raw);
    });

    // A pong proves the transport is alive. okhttp/RN answers pings on its own
    // native thread, so this still arrives while the app's JS thread is blocked
    // — that's exactly what lets us tolerate JS stalls (keep driving) yet detect
    // a real Wi-Fi drop fast.
    client.on('pong', () => {
      const state = clientState.get(client);
      if (state) {
        state.lastPongAt = Date.now();
      }
    });

    /** Decode and log each command in `raw`, coalescing the keep-alive flood. */
    function traceCommands(who: string, raw: string): void {
      const { items, rest } = parseCommandStream(cmdRest + raw);
      cmdRest = rest;
      for (const body of items) {
        const code = body.slice(0, CODE_LENGTH);
        const value = body.slice(CODE_LENGTH);
        if (code === COMMAND_CODES.KEEP_ALIVE) {
          kpSince += 1;
          const now = Date.now();
          if (now - kpLoggedAt >= KEEP_ALIVE_LOG_INTERVAL_MS) {
            log.debug('ws', 'app_to_car', {
              msg: `${who} -> car   kp  (KEEP_ALIVE x${kpSince})`,
              client: who,
              code,
              count: kpSince,
            });
            kpLoggedAt = now;
            kpSince = 0;
          }
          continue;
        }
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
      clientState.delete(client);
      log.info('ws', 'client_disconnected', {
        client: clientId,
        ip,
        code,
        reason: reason.toString(),
        clients: wss.clients.size,
      });
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

  // Ping watchdog (server → app): probe each client's transport and reap dead
  // ones. A pong (answered natively, even under a JS stall) refreshes liveness;
  // no pong within the pong timeout means the transport is gone (Wi-Fi dropped,
  // app killed), so we terminate it — which fires 'close' and disarms the car.
  const pingTimer = setInterval(() => {
    const now = Date.now();
    for (const client of wss.clients) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }
      const state = clientState.get(client);
      // Terminate only if truly silent — no pong AND no message within the
      // window. An actively-driving app keeps lastSeenAt fresh, so we must not
      // reap it just because okhttp's pong RTT jittered past the timeout.
      const lastInboundAt = state ? Math.max(state.lastPongAt, state.lastSeenAt) : 0;
      if (state && now - lastInboundAt > timings.pongTimeoutMs) {
        log.warn('ws', 'transport_lost', {
          client: state.id,
          sinceMs: now - lastInboundAt,
          msg: 'no pong or message — transport gone, terminating',
        });
        client.terminate();
        continue;
      }
      client.ping();
    }
  }, timings.pingIntervalMs);
  pingTimer.unref?.();

  /** A client keeps the car armed only while OPEN, transport-alive AND present. */
  function isClientLive(client: WebSocket, now: number): boolean {
    if (client.readyState !== WebSocket.OPEN) {
      return false;
    }
    const state = clientState.get(client);
    if (!state) {
      return false;
    }
    // Transport is alive if we've received ANYTHING from the client recently —
    // a pong OR any message. Drive commands and the presence beat are inbound
    // frames too, so an actively-driving app proves its own transport without
    // needing a pong; the pong only matters when the app goes quiet (e.g. a
    // JS-thread stall) while WiFi is up, where okhttp still answers it natively.
    // Gating on the pong ALONE false-tripped under okhttp's pong-RTT jitter
    // (measured ~660ms+ on a healthy LAN while drive commands streamed in fine).
    const lastInboundAt = Math.max(state.lastPongAt, state.lastSeenAt);
    return (
      now - lastInboundAt <= timings.pongTimeoutMs &&
      now - state.lastSeenAt <= timings.presenceTimeoutMs
    );
  }

  // Authoritative keep-alive generator (server → car). This is the safety beat
  // the firmware watches — it brakes after ~300ms of silence. It runs on Node's
  // reliable loop, NOT the RN JS thread, so app-side jank can no longer starve
  // it and false-trip the car. It flows only while ≥1 client is live (above);
  // the moment none are, we send one explicit stop and let the firmware's own
  // timeout back us up.
  const keepAliveTimer = setInterval(() => {
    const now = Date.now();
    let anyLive = false;
    for (const client of wss.clients) {
      if (isClientLive(client, now)) {
        anyLive = true;
        break;
      }
    }
    if (anyLive) {
      if (!carArmed) {
        carArmed = true;
        log.info('server', 'car_armed', { msg: 'live client — keep-alive started' });
      }
      link.write(frameCommand(COMMAND_CODES.KEEP_ALIVE));
    } else if (carArmed) {
      // Live→dead edge: the controlling app is gone (disconnect, Wi-Fi loss,
      // suspended/killed). Stop now; don't wait for the firmware timeout.
      carArmed = false;
      link.write(frameCommand(COMMAND_CODES.STOP));
      log.warn('server', 'car_stopped', {
        msg: 'no live client — keep-alive stopped, car stopped',
      });
    }
  }, timings.intervalMs);
  keepAliveTimer.unref?.();

  httpServer.listen(config.wsPort, config.host);
  await once(httpServer, 'listening');
  const port = (httpServer.address() as AddressInfo).port;
  log.info('ws', 'listening', { host: config.host, port, simulate: config.simulate });

  return {
    port,
    clientCount: () => wss.clients.size,
    close: async () => {
      clearInterval(gapTimer);
      clearInterval(pingTimer);
      clearInterval(keepAliveTimer);
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
