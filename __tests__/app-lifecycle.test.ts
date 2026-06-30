// Controllable AppState mock — capture the 'change' handler so the test can
// drive foreground/background transitions. app-lifecycle is the only consumer
// of react-native in this module graph (transmitter/presence are mocked), so
// replacing the whole module is safe here. (jest.mock factories may only touch
// `mock`-prefixed outer variables, hence the names.)
let mockChangeHandler: ((s: string) => void) | undefined;
const mockRemove = jest.fn();
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, cb: (s: string) => void) => {
      mockChangeHandler = cb;
      return { remove: mockRemove };
    },
  },
}));

const mockSend = jest.fn();
jest.mock('../src/utils/transmitter', () => ({ send: (c: string) => mockSend(c) }));

const mockStartPresence = jest.fn();
const mockStopPresence = jest.fn();
jest.mock('../src/utils/presence', () => ({
  start: () => mockStartPresence(),
  stop: () => mockStopPresence(),
}));

import { COMMAND_CODES } from '../shared/protocol';
import { start, stop } from '../src/utils/app-lifecycle';

describe('app-lifecycle safety stop', () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockStartPresence.mockClear();
    mockStopPresence.mockClear();
    mockRemove.mockClear();
    mockChangeHandler = undefined;
  });
  afterEach(() => stop());

  it('stops the car and pauses the presence beat when backgrounded', () => {
    start();
    mockChangeHandler?.('background');
    expect(mockSend).toHaveBeenCalledWith(COMMAND_CODES.STOP);
    expect(mockStopPresence).toHaveBeenCalledTimes(1);
    expect(mockStartPresence).not.toHaveBeenCalled();
  });

  it('ignores the iOS-only transient "inactive" state (Android signals background)', () => {
    start();
    mockChangeHandler?.('inactive');
    expect(mockSend).not.toHaveBeenCalled();
    expect(mockStopPresence).not.toHaveBeenCalled();
  });

  it('resumes the presence beat when the app returns to the foreground', () => {
    start();
    mockChangeHandler?.('active');
    expect(mockStartPresence).toHaveBeenCalledTimes(1);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('subscribes once (idempotent) and unsubscribes on stop', () => {
    start();
    start();
    stop();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
