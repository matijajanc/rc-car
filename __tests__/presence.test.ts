// The presence beat is the app→server "still alive and in control" signal. The
// car's actual keep-alive is generated server-side now, so this only needs to
// be a relaxed cadence the JS thread holds easily. transmitter is mocked so the
// module graph never touches the WebSocket / react-native-config.
const mockSend = jest.fn();
jest.mock('../src/utils/transmitter', () => ({ send: (c: string) => mockSend(c) }));

import { COMMAND_CODES } from '../shared/protocol';
import { start, stop } from '../src/utils/presence';

describe('presence beat', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSend.mockClear();
  });
  afterEach(() => {
    stop();
    jest.useRealTimers();
  });

  it('sends a keep-alive on a relaxed (~250ms) cadence', () => {
    start();
    expect(mockSend).not.toHaveBeenCalled(); // nothing until the first tick
    jest.advanceTimersByTime(250);
    expect(mockSend).toHaveBeenCalledWith(COMMAND_CODES.KEEP_ALIVE);
    expect(mockSend).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(500);
    expect(mockSend).toHaveBeenCalledTimes(3); // ticks at 250, 500, 750
  });

  it('is idempotent — a second start() does not double the cadence', () => {
    start();
    start();
    jest.advanceTimersByTime(250);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('stops beating after stop()', () => {
    start();
    jest.advanceTimersByTime(250);
    expect(mockSend).toHaveBeenCalledTimes(1);
    stop();
    jest.advanceTimersByTime(1000);
    expect(mockSend).toHaveBeenCalledTimes(1); // no further beats
  });
});
