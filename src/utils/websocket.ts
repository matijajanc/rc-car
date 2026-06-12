import Config from 'react-native-config';
import { EventRegister } from 'react-native-event-listeners';

/**
 * Owns the single app WebSocket and broadcasts its connection state on the
 * 'wsStatus' event bus, so the UI (Connect screen + the status dot) can react —
 * including drops that happen after you've navigated away from Connect.
 *
 * A backward-compatible default export (`.createSocket` / `.get`) keeps the
 * older call sites working.
 */
export type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
export const WS_STATUS_EVENT = 'wsStatus';

let socket: WebSocket | null = null;
let status: WsStatus = 'idle';
let lastIp = '';

function emit(next: WsStatus): void {
  status = next;
  EventRegister.emit(WS_STATUS_EVENT, next);
}

export function getStatus(): WsStatus {
  return status;
}

/** The IP of the most recent connect attempt (for diagnostics). */
export function getLastIp(): string {
  return lastIp;
}

export function createSocket(ip: string): WebSocket {
  lastIp = ip;
  // Drop any previous socket quietly before opening a new one.
  if (socket) {
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
  }

  const ws = new WebSocket(`ws://${ip}:${Config.WS_PORT}`);
  socket = ws;
  emit('connecting');
  ws.onopen = () => emit('connected');
  ws.onclose = () => emit('disconnected');
  ws.onerror = () => emit('disconnected');
  return ws;
}

export function getSocket(): WebSocket | null {
  return socket;
}

export default { createSocket, get: getSocket, getStatus };
