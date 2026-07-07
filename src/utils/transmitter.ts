import { COMMAND_TERMINATOR } from '../../shared/protocol';
import { getSocket } from './websocket';

/**
 * Send a command to the car. Appends the command terminator exactly once.
 * `command` is the full body, e.g. 'sc-3', 'dvfc', or built from COMMAND_CODES.
 */
export function send(command: string): void {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(command + COMMAND_TERMINATOR);
  }
}

export default { send };
