import Config from 'react-native-config';
import { EventRegister } from 'react-native-event-listeners';

/**
 * Owns the single app WebSocket and broadcasts its connection state on the
 * 'wsStatus' event bus, so the UI (Connect screen + the status dot) can react —
 * including drops that happen after you've navigated away from Connect.
 *
 * On an unexpected drop it transparently reconnects with backoff — reporting
 * 'connecting', not 'disconnected' — so a brief link blackout (e.g. the phone's
 * Wi-Fi radio dozing during a driving pause) recovers on its own without the
 * user re-tapping Connect. Safety: the bridge stops the car the instant the
 * socket drops and, on reconnect, only re-arms it — no drive command is
 * replayed — so the car never resumes motion by itself; it waits for a
 * deliberate press.
 *
 * A backward-compatible default export (`.createSocket` / `.get`) keeps the
 * older call sites working.
 */
export type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
export const WS_STATUS_EVENT = 'wsStatus';

// react-native-config returns no values when the app is built without an .env
// file (e.g. in CI). Fall back to the bridge's documented default port so we
// never build a malformed `ws://host:undefined` URL — that throws in the native
// WebSocket the instant you press Connect and crashes the app.
const DEFAULT_WS_PORT = '8085';

// Reconnect backoff: 1s, 2s, 4s, 8s, capped at 10s; reset on a successful open.
const RECONNECT_BASE_MS = 1000;
const RECONNECT_CAP_MS = 10000;

let socket: WebSocket | null = null;
let status: WsStatus = 'idle';
let lastIp = '';
// True between createSocket() and disconnect(): a drop while true triggers a
// backoff reconnect; a drop while false is a deliberate, user-intended close.
let shouldReconnect = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

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

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/** Drop all handlers so a dead socket can't fire callbacks or leak onmessage. */
function detach(ws: WebSocket | null): void {
  if (ws) {
    ws.onopen = null;
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
  }
}

function open(ip: string): WebSocket {
  detach(socket);
  socket?.close();

  const port = Config.WS_PORT || DEFAULT_WS_PORT;
  const ws = new WebSocket(`ws://${ip}:${port}`);
  socket = ws;
  emit('connecting');
  ws.onopen = () => {
    reconnectAttempts = 0;
    emit('connected');
  };
  ws.onclose = () => handleDrop();
  ws.onerror = () => handleDrop();
  return ws;
}

/**
 * A close/error on the live socket. onerror is typically followed by onclose,
 * so we detach first to run this exactly once. If we still want to be connected,
 * retry with backoff and report 'connecting' (not 'disconnected') so the UI
 * shows "reconnecting" and doesn't bounce back to the Connect screen.
 */
function handleDrop(): void {
  detach(socket);
  if (!shouldReconnect) {
    emit('disconnected');
    return;
  }
  emit('connecting');
  clearReconnectTimer();
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_CAP_MS);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    if (shouldReconnect) {
      open(lastIp);
    }
  }, delay);
}

/** Open (or replace) the app WebSocket to `ip` and enable auto-reconnect. */
export function createSocket(ip: string): WebSocket {
  lastIp = ip;
  shouldReconnect = true;
  reconnectAttempts = 0;
  clearReconnectTimer();
  return open(ip);
}

/**
 * Close the socket and stop reconnecting — a deliberate disconnect (the user,
 * or the Connect screen giving up after its timeout). Emits 'disconnected'.
 */
export function disconnect(): void {
  shouldReconnect = false;
  clearReconnectTimer();
  reconnectAttempts = 0;
  detach(socket);
  socket?.close();
  socket = null;
  emit('disconnected');
}

export function getSocket(): WebSocket | null {
  return socket;
}

export default { createSocket, disconnect, get: getSocket, getStatus };
