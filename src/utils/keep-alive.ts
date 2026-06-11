import { COMMAND_CODES } from '../../shared/protocol';
import { send } from './transmitter';

/**
 * Safety mechanism: send a keep-alive every 100ms. The car stops itself if it
 * misses the signal 3× in a row. Do not throttle this without understanding
 * the safety implication.
 */
let timer: ReturnType<typeof setInterval> | null = null;

export function start(): void {
  if (timer) {
    return;
  }
  timer = setInterval(() => send(COMMAND_CODES.KEEP_ALIVE), 100);
}

export function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export default { start, stop };
