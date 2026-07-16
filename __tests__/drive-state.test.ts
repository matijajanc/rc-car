// Controllable AppState mock — capture the 'change' handler so the test can
// drive foreground/background transitions. (jest.mock factories may only touch
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

const mockAcquire = jest.fn();
const mockRelease = jest.fn();
jest.mock('../src/utils/drive-locks', () => ({
  acquireDriveLocks: () => mockAcquire(),
  releaseDriveLocks: () => mockRelease(),
}));

import { COMMAND_CODES, DRIVE_STEER, DRIVE_THROTTLE } from '../shared/protocol';
import {
  setSteer,
  setThrottle,
  startDriveSession,
  stopDriveSession,
} from '../src/utils/drive-state';

const sentFrames = (): string[] => mockSend.mock.calls.map((c) => String(c[0]));

describe('drive session (motion lease sender)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSend.mockClear();
    mockAcquire.mockClear();
    mockRelease.mockClear();
    mockRemove.mockClear();
    mockChangeHandler = undefined;
  });

  afterEach(() => {
    stopDriveSession();
    jest.useRealTimers();
  });

  it('asserts a neutral state immediately and holds the native locks', () => {
    startDriveSession();
    expect(sentFrames()).toEqual(['dvnc']);
    expect(mockAcquire).toHaveBeenCalledTimes(1);
  });

  it('sends a forward level immediately, then refreshes it every 150ms while engaged', () => {
    startDriveSession();
    mockSend.mockClear();

    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    expect(sentFrames()).toEqual(['dvfc80']); // immediate (direction change)

    jest.advanceTimersByTime(460); // heartbeats at 150/300/450 re-assert
    expect(sentFrames()).toEqual(['dvfc80', 'dvfc80', 'dvfc80', 'dvfc80']);
  });

  it('drops to the slow idle tick once everything is released', () => {
    startDriveSession();
    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    setThrottle(DRIVE_THROTTLE.NEUTRAL);
    mockSend.mockClear();

    // Idle: only the ~1s radio-warming tick, not the 150ms refresh.
    jest.advanceTimersByTime(2200);
    const idle = sentFrames();
    expect(idle.length).toBeGreaterThanOrEqual(2);
    expect(idle.length).toBeLessThanOrEqual(3);
    expect(new Set(idle)).toEqual(new Set(['dvnc']));
  });

  it('re-asserting the same state does not send a duplicate frame', () => {
    startDriveSession();
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.NEUTRAL);
    setSteer(DRIVE_STEER.CENTER);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('combines throttle+level and steering into one absolute state', () => {
    startDriveSession();
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    setSteer(DRIVE_STEER.LEFT);
    expect(sentFrames()).toEqual(['dvfc80', 'dvfl80']);
  });

  it('backgrounding zeroes the state, sends one stop, and stops streaming', () => {
    startDriveSession();
    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    mockSend.mockClear();

    mockChangeHandler?.('background');
    expect(sentFrames()).toEqual([COMMAND_CODES.STOP]);

    // Suspended: no dv frames flow, and input is ignored until foregrounded.
    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    jest.advanceTimersByTime(1000);
    expect(sentFrames()).toEqual([COMMAND_CODES.STOP]);
  });

  it('ignores the iOS-only transient "inactive" state', () => {
    startDriveSession();
    mockSend.mockClear();
    mockChangeHandler?.('inactive');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('resumes neutral streaming on return to the foreground', () => {
    startDriveSession();
    mockChangeHandler?.('background');
    mockSend.mockClear();

    mockChangeHandler?.('active');
    jest.advanceTimersByTime(1200);
    // Nothing moves on its own: only neutral idle frames until a real press.
    expect(new Set(sentFrames())).toEqual(new Set(['dvnc']));
  });

  it('stopping the session sends one stop and releases the locks', () => {
    startDriveSession();
    mockSend.mockClear();
    stopDriveSession();
    expect(sentFrames()).toEqual([COMMAND_CODES.STOP]);
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledTimes(1);

    // Fully stopped: no stray timers keep sending.
    jest.advanceTimersByTime(2000);
    expect(sentFrames()).toEqual([COMMAND_CODES.STOP]);
  });

  it('coalesces rapid same-direction level changes', () => {
    startDriveSession();
    mockSend.mockClear();

    setThrottle(DRIVE_THROTTLE.FORWARD, 10); // immediate (direction change)
    jest.advanceTimersByTime(20);
    setThrottle(DRIVE_THROTTLE.FORWARD, 35); // +20ms < 60ms -> coalesced
    jest.advanceTimersByTime(20);
    setThrottle(DRIVE_THROTTLE.FORWARD, 55); // +40ms < 60ms -> coalesced
    expect(sentFrames()).toEqual(['dvfc10']);

    jest.advanceTimersByTime(40); // t=80ms, still before the 150ms heartbeat
    setThrottle(DRIVE_THROTTLE.FORWARD, 60); // >=60ms since last send -> sends
    expect(sentFrames()).toEqual(['dvfc10', 'dvfc60']);
  });

  it('the 150ms heartbeat re-asserts the latest coalesced level', () => {
    startDriveSession();
    mockSend.mockClear();

    setThrottle(DRIVE_THROTTLE.FORWARD, 10); // immediate
    jest.advanceTimersByTime(20);
    setThrottle(DRIVE_THROTTLE.FORWARD, 35); // coalesced (dropped)
    jest.advanceTimersByTime(130); // t=150ms -> heartbeat asserts current state
    expect(sentFrames()).toEqual(['dvfc10', 'dvfc35']);
  });

  it('a release to neutral is sent immediately, even inside the coalescing window', () => {
    startDriveSession();
    setThrottle(DRIVE_THROTTLE.FORWARD, 50);
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.NEUTRAL); // direction change -> immediate
    expect(sentFrames()).toEqual(['dvnc']);
  });

  it('treats a forward level below one step as neutral', () => {
    startDriveSession();
    setThrottle(DRIVE_THROTTLE.FORWARD, 40); // dvfc40
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.FORWARD, 2); // below DRIVE_LEVEL_STEP -> coasts to neutral
    expect(sentFrames()).toEqual(['dvnc']);
  });
});
