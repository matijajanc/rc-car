import Config from 'react-native-config';

/**
 * Holds the single app WebSocket. Set once on connect; read everywhere via
 * getSocket(). A backward-compatible default export (`.createSocket` / `.get`)
 * keeps the legacy call sites working.
 */
let socket: WebSocket | null = null;

export function createSocket(ip: string): WebSocket {
  socket = new WebSocket(`ws://${ip}:${Config.WS_PORT}`);
  return socket;
}

export function getSocket(): WebSocket | null {
  return socket;
}

export default { createSocket, get: getSocket };
