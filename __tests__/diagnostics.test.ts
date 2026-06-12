// Mock the two native modules pulled in transitively (via websocket.ts).
jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { WS_PORT: '8085', WS_SERVER_IP: '' },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));
// The real module ships untransformed ESM the RN jest preset won't process;
// a tiny in-memory emitter is enough to drive diagnostics in a test.
jest.mock('react-native-event-listeners', () => {
  const listeners: Record<string, Array<(data: unknown) => void>> = {};
  return {
    EventRegister: {
      addEventListener: (name: string, cb: (data: unknown) => void): string => {
        const arr = listeners[name] ?? (listeners[name] = []);
        arr.push(cb);
        return `${name}-${arr.length}`;
      },
      removeEventListener: (): boolean => true,
      emit: (name: string, data: unknown): void => {
        (listeners[name] ?? []).forEach((cb) => cb(data));
      },
    },
  };
});

import { EventRegister } from 'react-native-event-listeners';
import { WS_STATUS_EVENT } from '../src/utils/websocket';
import { clearEvents, getEvents, startDiagnostics } from '../src/utils/diagnostics';

describe('diagnostics connection log', () => {
  beforeAll(() => startDiagnostics());
  beforeEach(async () => {
    await clearEvents();
  });

  it('records wsStatus transitions with timestamps', () => {
    EventRegister.emit(WS_STATUS_EVENT, 'connecting');
    EventRegister.emit(WS_STATUS_EVENT, 'connected');
    EventRegister.emit(WS_STATUS_EVENT, 'disconnected');

    const events = getEvents();
    expect(events.map((e) => e.status)).toEqual(['connecting', 'connected', 'disconnected']);
    expect(typeof events[0]?.ts).toBe('string');
  });

  it('caps the log at the buffer size (100)', () => {
    for (let i = 0; i < 130; i += 1) {
      EventRegister.emit(WS_STATUS_EVENT, 'connecting');
    }
    expect(getEvents().length).toBeLessThanOrEqual(100);
  });
});
