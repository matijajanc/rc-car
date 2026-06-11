import { EventRegister } from 'react-native-event-listeners';
import { parseTelemetryStream, Telemetry } from '../../shared/protocol';
import { getSocket } from './websocket';

/**
 * Subscribe to telemetry from the car. Frames are buffered across messages
 * (a frame can be split) and each decoded {code, value} is emitted on the
 * 'wsReceive' event bus that the dashboard widgets listen to.
 */
let buffer = '';

export function receive(): void {
  const socket = getSocket();
  if (!socket) {
    return;
  }
  buffer = '';
  socket.onmessage = (event: WebSocketMessageEvent) => {
    const { items, rest } = parseTelemetryStream(buffer + String(event.data));
    buffer = rest;
    items.forEach((frame: Telemetry) => EventRegister.emit('wsReceive', frame));
  };
}

export default { receive };
