/**
 * RC car wire protocol — single source of truth.
 *
 * This module has ZERO runtime dependencies so it can be shared by both the
 * NodeJS bridge server and the React Native app. It replaces the protocol
 * knowledge that previously lived only as comments in
 * `src/utils/transmitter.js` and `src/utils/receiver.js`.
 *
 * Two directions, two terminators (this asymmetry is real, not a bug):
 *   - App  -> car : "<code><value>" terminated by '\n'  (COMMAND_TERMINATOR)
 *   - Car  -> app : "<code><value>" terminated by 'X'   (TELEMETRY_TERMINATOR)
 *
 * A "code" is always exactly two ASCII characters; the value is whatever
 * follows it up to the terminator.
 */

/** Terminator the app appends to every command sent to the car. */
export const COMMAND_TERMINATOR = '\n';

/** Terminator the car appends to every telemetry frame it sends back. */
export const TELEMETRY_TERMINATOR = 'X';

/** Number of leading characters that make up a code. */
export const CODE_LENGTH = 2;

/**
 * Commands the app sends to the car (app -> car).
 * Mirrors the legacy comment block in src/utils/transmitter.js.
 */
export const COMMAND_CODES = {
  DRIVE_MODE: 'dm',
  ACCEL_DRIVE: 'ad',
  ACCEL_BACKWARD: 'ab',
  ACCEL_STEER: 'as',
  DRIVE_BUTTONS: 'db',
  KEEP_ALIVE: 'kp',
  STEER_CALIBRATE: 'sc',
  STOP: 'st',
  SPEED_FACTOR: 'sf',
  // Arduino options
  RANGE_SENSORS: 'rs',
  RANGE_SERVO_ANGLE: 'rc',
  CAR_LIGHTS: 'cl',
  BLINKERS: 'bl',
  ALL_BLINKERS: 'b4',
  CAMERA: 'cm',
  LONG_LIGHTS: 'll',
} as const;

export type CommandCode = (typeof COMMAND_CODES)[keyof typeof COMMAND_CODES];

/**
 * Telemetry the car streams back to the app (car -> app).
 * Mirrors the legacy comment block in src/utils/receiver.js.
 */
export const TELEMETRY_CODES = {
  MOTOR_TEMP: 'mt',
  SPEED: 'sp',
  BATTERY_VOLTAGE: 'bv',
  RANGE_SENSOR_PROBLEM: 'rs',
} as const;

export type TelemetryCode = (typeof TELEMETRY_CODES)[keyof typeof TELEMETRY_CODES];

/** A decoded telemetry frame: a two-character code plus its raw string value. */
export interface Telemetry {
  code: string;
  value: string;
}

/** Result of parsing a chunk of a stream: complete items plus a leftover tail. */
export interface StreamParseResult<T> {
  items: T[];
  /** Bytes after the last terminator — hold onto these and prepend next chunk. */
  rest: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';

/**
 * Build the body of a command ("<code><value>") with no terminator.
 * Use this when something else appends the terminator; otherwise prefer
 * {@link frameCommand}.
 */
export function encodeCommand(code: string, value?: string | number): string {
  return value === undefined || value === null ? code : `${code}${value}`;
}

/**
 * Build a complete, terminated command frame ready to put on the wire.
 *
 * Note: the legacy keep-alive (src/utils/keep-alive.js) double-appended the
 * terminator. Centralising framing here removes that footgun — callers pass a
 * code/value and get exactly one terminator.
 */
export function frameCommand(code: string, value?: string | number): string {
  return encodeCommand(code, value) + COMMAND_TERMINATOR;
}

/**
 * Decode a single telemetry frame the way the legacy receiver did: take the
 * characters up to the first 'X', then split into a 2-char code and the rest.
 * Returns null when there is no parseable code.
 */
export function decodeTelemetryFrame(raw: string): Telemetry | null {
  if (!isString(raw)) {
    return null;
  }
  const upToTerminator = raw.split(TELEMETRY_TERMINATOR)[0] ?? '';
  if (upToTerminator.length < CODE_LENGTH) {
    return null;
  }
  return {
    code: upToTerminator.slice(0, CODE_LENGTH),
    value: upToTerminator.slice(CODE_LENGTH),
  };
}

/**
 * Parse a chunk of the telemetry byte stream into complete frames.
 *
 * Serial data arrives in arbitrary chunks, so a frame may be split across two
 * reads. Feed each chunk in together with the previous call's `rest`:
 *
 *   let rest = '';
 *   onData(chunk => {
 *     const out = parseTelemetryStream(rest + chunk);
 *     out.items.forEach(handle);
 *     rest = out.rest;
 *   });
 */
export function parseTelemetryStream(buffer: string): StreamParseResult<Telemetry> {
  const segments = buffer.split(TELEMETRY_TERMINATOR);
  const rest = segments.pop() ?? '';
  const items: Telemetry[] = [];
  for (const segment of segments) {
    if (segment.length >= CODE_LENGTH) {
      items.push({
        code: segment.slice(0, CODE_LENGTH),
        value: segment.slice(CODE_LENGTH),
      });
    }
  }
  return { items, rest };
}

/**
 * Parse a chunk of the command byte stream (app -> car) into complete command
 * bodies, splitting on the command terminator. The car side uses this to know
 * when a command is finished. Empty segments are dropped.
 */
export function parseCommandStream(buffer: string): StreamParseResult<string> {
  const segments = buffer.split(COMMAND_TERMINATOR);
  const rest = segments.pop() ?? '';
  const items = segments.filter((segment) => segment.length > 0);
  return { items, rest };
}

/**
 * Format a stored setting value for transmission, mirroring the legacy
 * src/utils/settings.js logic: booleans become 1/0, everything else passes
 * through unchanged. Accepts the AsyncStorage string forms ('true'/'false')
 * as well as real booleans.
 */
export function formatSettingValue(value: unknown): string | number {
  if (value === true || value === 'true') {
    return 1;
  }
  if (value === false || value === 'false') {
    return 0;
  }
  return value as string | number;
}
