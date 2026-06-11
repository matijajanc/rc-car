import { once } from 'node:events';
import { AddressInfo } from 'node:net';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { ServerConfig } from './config';
import { CarLink } from './link';

export interface BridgeOptions {
  logger?: (message: string) => void;
}

export interface Bridge {
  /** The port the WebSocket server actually bound to. */
  readonly port: number;
  /** Number of currently connected app clients. */
  clientCount(): number;
  /** Stop accepting clients, disconnect everyone, and close the car link. */
  close(): Promise<void>;
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
 * server. This is the modern equivalent of the legacy server.js: telemetry
 * from the car is broadcast to every connected app, and commands from any app
 * are written to the car.
 */
export async function startBridge(
  config: ServerConfig,
  link: CarLink,
  options: BridgeOptions = {},
): Promise<Bridge> {
  const log = options.logger ?? ((message: string) => console.log(message));

  await link.open();

  const wss = new WebSocketServer({ port: config.wsPort, host: config.host });
  await once(wss, 'listening');
  const port = (wss.address() as AddressInfo).port;

  // Car -> apps: broadcast every telemetry chunk to all open clients.
  link.onData((chunk) => {
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(chunk);
      }
    }
  });
  link.onError((error) => log(`[link] error: ${error.message}`));
  link.onClose(() => log('[link] closed'));

  // Apps -> car: forward every message verbatim to the car link.
  wss.on('connection', (client) => {
    log(`[ws] client connected (${wss.clients.size} total)`);
    client.on('message', (data) => {
      const frame = rawDataToString(data);
      link.write(frame);
    });
    client.on('error', (error) => log(`[ws] client error: ${error.message}`));
    client.on('close', () => log(`[ws] client disconnected (${wss.clients.size} total)`));
  });

  log(`[ws] listening on ${config.host}:${port} (simulate=${config.simulate})`);

  return {
    port,
    clientCount: () => wss.clients.size,
    close: async () => {
      for (const client of wss.clients) {
        client.terminate();
      }
      await new Promise<void>((resolve, reject) => {
        wss.close((error) => (error ? reject(error) : resolve()));
      });
      await link.close();
    },
  };
}
