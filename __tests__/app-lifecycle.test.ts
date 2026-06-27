// Controllable AppState mock — capture the 'change' handler so the test can
// drive foreground/background transitions. app-lifecycle is the only consumer
// of react-native in this module graph (transmitter/keep-alive are mocked), so
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

const mockStartKA = jest.fn();
const mockStopKA = jest.fn();
jest.mock('../src/utils/keep-alive', () => ({
  start: () => mockStartKA(),
  stop: () => mockStopKA(),
}));

import { COMMAND_CODES } from '../shared/protocol';
import { start, stop } from '../src/utils/app-lifecycle';

describe('app-lifecycle safety stop', () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockStartKA.mockClear();
    mockStopKA.mockClear();
    mockRemove.mockClear();
    mockChangeHandler = undefined;
  });
  afterEach(() => stop());

  it('stops the car and pauses the keep-alive when backgrounded', () => {
    start();
    mockChangeHandler?.('background');
    expect(mockSend).toHaveBeenCalledWith(COMMAND_CODES.STOP);
    expect(mockStopKA).toHaveBeenCalledTimes(1);
    expect(mockStartKA).not.toHaveBeenCalled();
  });

  it('ignores the iOS-only transient "inactive" state (Android signals background)', () => {
    start();
    mockChangeHandler?.('inactive');
    expect(mockSend).not.toHaveBeenCalled();
    expect(mockStopKA).not.toHaveBeenCalled();
  });

  it('resumes the keep-alive when the app returns to the foreground', () => {
    start();
    mockChangeHandler?.('active');
    expect(mockStartKA).toHaveBeenCalledTimes(1);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('subscribes once (idempotent) and unsubscribes on stop', () => {
    start();
    start();
    stop();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
