import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventRegister } from 'react-native-event-listeners';
import { WS_STATUS_EVENT, getLastIp } from './websocket';
import type { WsStatus } from './websocket';

/**
 * A small ring buffer of connection events (the app-side companion to the
 * server's /logs). It records every wsStatus transition with a timestamp and
 * the target IP, persists to AsyncStorage so it survives restarts, and emits
 * DIAG_EVENT so the Diagnostics screen can refresh.
 */
export interface DiagEvent {
  ts: string;
  status: WsStatus;
  ip: string;
}

export const DIAG_EVENT = 'diagUpdated';
const STORAGE_KEY = 'diag-events';
const MAX_EVENTS = 100;

let events: DiagEvent[] = [];
let started = false;

export function getEvents(): DiagEvent[] {
  return events;
}

export async function clearEvents(): Promise<void> {
  events = [];
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  EventRegister.emit(DIAG_EVENT, events);
}

function record(status: WsStatus): void {
  const event: DiagEvent = {
    ts: new Date().toISOString(),
    status,
    ip: getLastIp(),
  };
  events = [...events, event].slice(-MAX_EVENTS);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events)).catch(() => undefined);
  EventRegister.emit(DIAG_EVENT, events);
}

/** Begin recording connection events. Safe to call more than once. */
export function startDiagnostics(): void {
  if (started) {
    return;
  }
  started = true;

  AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      if (!raw) {
        return;
      }
      try {
        events = JSON.parse(raw) as DiagEvent[];
        EventRegister.emit(DIAG_EVENT, events);
      } catch {
        events = [];
      }
    })
    .catch(() => undefined);

  EventRegister.addEventListener(WS_STATUS_EVENT, (status: WsStatus) => record(status));
}
