// The app WebSocket owns auto-reconnect: an unexpected drop retries with
// backoff and reports 'connecting' (not 'disconnected') so the UI shows
// "reconnecting"; a deliberate disconnect() stops retrying. Native deps are
// mocked the way the other util tests do — the RN jest preset won't transform
// them — and a fake global WebSocket + fake timers drive the backoff.
const mockEmit = jest.fn();
jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { WS_PORT: '8085', WS_SERVER_IP: '' },
}));
jest.mock('react-native-event-listeners', () => ({
  EventRegister: {
    addEventListener: (): string => 'sub',
    removeEventListener: (): boolean => true,
    emit: (_name: string, data: unknown): void => {
      mockEmit(data);
    },
  },
}));

import { createSocket, disconnect, getSocket } from '../src/utils/websocket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: unknown) => void) | null = null;
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }
}

const statuses = (): string[] => mockEmit.mock.calls.map((c) => c[0] as string);
const latest = (): FakeWebSocket =>
  FakeWebSocket.instances[FakeWebSocket.instances.length - 1];

describe('app WebSocket auto-reconnect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockEmit.mockClear();
    FakeWebSocket.instances = [];
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;
  });
  afterEach(() => {
    disconnect(); // reset module state (socket/flags/timer) between tests
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('emits connecting then connected on a successful open', () => {
    createSocket('1.2.3.4');
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(latest().url).toBe('ws://1.2.3.4:8085');
    expect(statuses()).toEqual(['connecting']);

    latest().onopen?.();
    expect(statuses()).toEqual(['connecting', 'connected']);
  });

  it('reconnects with backoff on an unexpected drop, staying "connecting"', () => {
    createSocket('1.2.3.4');
    latest().onopen?.();
    mockEmit.mockClear();

    // A drop reports 'connecting' (never 'disconnected') and opens no socket yet.
    latest().onclose?.();
    expect(statuses()).toEqual(['connecting']);
    expect(FakeWebSocket.instances).toHaveLength(1);

    // After the 1s backoff a fresh socket opens and can connect again.
    jest.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    latest().onopen?.();
    expect(statuses()).toContain('connected');
    expect(statuses()).not.toContain('disconnected');
  });

  it('grows the backoff across consecutive failed attempts (1s, then 2s)', () => {
    createSocket('1.2.3.4'); // instance 1
    latest().onclose?.(); // schedule retry #1 at 1s
    jest.advanceTimersByTime(999);
    expect(FakeWebSocket.instances).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(2); // retry #1 (never opens)

    latest().onclose?.(); // schedule retry #2 at 2s (backoff doubled)
    jest.advanceTimersByTime(1999);
    expect(FakeWebSocket.instances).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(3); // retry #2
  });

  it('disconnect() stops reconnecting and emits disconnected', () => {
    createSocket('1.2.3.4');
    latest().onclose?.(); // schedules a reconnect
    mockEmit.mockClear();

    disconnect();
    expect(statuses()).toEqual(['disconnected']);
    expect(getSocket()).toBeNull();

    // The pending reconnect must not fire after a deliberate disconnect.
    jest.advanceTimersByTime(10000);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
