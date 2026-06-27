// In-memory event bus mock (the real module ships untransformed ESM the RN jest
// preset won't process). Unlike the diagnostics test we honour removeEventListener
// so the monitor's wsReceive listener is torn down between tests.
jest.mock('react-native-event-listeners', () => {
  const byId = new Map<string, { name: string; cb: (data: unknown) => void }>();
  let seq = 0;
  return {
    EventRegister: {
      addEventListener: (name: string, cb: (data: unknown) => void): string => {
        const id = `evt-${(seq += 1)}`;
        byId.set(id, { name, cb });
        return id;
      },
      removeEventListener: (id: string): boolean => byId.delete(id),
      emit: (name: string, data: unknown): void => {
        byId.forEach((entry) => {
          if (entry.name === name) {
            entry.cb(data);
          }
        });
      },
    },
  };
});

// settings.sendAll pulls in native modules transitively; stub it and assert the
// monitor replays settings on recovery.
const mockSendAll = jest.fn(() => Promise.resolve());
jest.mock('../src/utils/settings', () => ({ sendAll: () => mockSendAll() }));

import { EventRegister } from 'react-native-event-listeners';
import { start, stop, getStatus, CAR_LINK_EVENT } from '../src/utils/car-link';

const telemetry = (): void => EventRegister.emit('wsReceive', { code: 'sp', value: '0' });
const bootBeacon = (): void => EventRegister.emit('wsReceive', { code: 'rb', value: '1' });

describe('car-link liveness monitor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSendAll.mockClear();
  });
  afterEach(() => {
    stop();
    jest.useRealTimers();
  });

  it('stays alive while telemetry keeps arriving', () => {
    const seen: string[] = [];
    EventRegister.addEventListener(CAR_LINK_EVENT, (s) => seen.push(s as string));
    start();
    for (let i = 0; i < 10; i += 1) {
      jest.advanceTimersByTime(400);
      telemetry();
    }
    expect(getStatus()).toBe('alive');
    expect(seen).not.toContain('lost');
  });

  it('goes lost after a telemetry silence and recovers on the next frame', () => {
    const seen: string[] = [];
    EventRegister.addEventListener(CAR_LINK_EVENT, (s) => seen.push(s as string));
    start();

    jest.advanceTimersByTime(3000); // > 2500ms with no telemetry
    expect(getStatus()).toBe('lost');
    expect(seen).toContain('lost');

    telemetry();
    expect(getStatus()).toBe('alive');
    expect(seen[seen.length - 1]).toBe('alive');
  });

  it('replays settings when the link recovers (the car may have reset)', () => {
    start();
    jest.advanceTimersByTime(3000);
    expect(mockSendAll).not.toHaveBeenCalled();

    telemetry();
    expect(mockSendAll).toHaveBeenCalledTimes(1);
  });

  it('does not replay settings while telemetry never lapses', () => {
    start();
    telemetry();
    jest.advanceTimersByTime(400);
    telemetry();
    expect(mockSendAll).not.toHaveBeenCalled();
  });

  it('replays settings on a boot beacon even without a detected gap', () => {
    start();
    bootBeacon(); // car reset and rebooted faster than the 2.5s 'lost' threshold
    expect(mockSendAll).toHaveBeenCalledTimes(1);
  });

  it('collapses a recovery + boot beacon arriving together into one replay', () => {
    start();
    jest.advanceTimersByTime(3000); // link goes 'lost'
    bootBeacon(); // first frame back is the boot beacon: recovery AND reboot
    expect(mockSendAll).toHaveBeenCalledTimes(1);
  });
});
