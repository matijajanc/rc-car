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
 */
export const COMMAND_CODES = {
  /**
   * Absolute drive state ("motion lease") — value is "<throttle><steer>[level]",
   * e.g. 'dvfc' = forward + straight (no level), 'dvnc' = fully idle.
   * Forward frames also carry a 0..100 magnitude ('dvfc80' = forward, centre, 80%);
   * neutral and reverse never do. See DRIVE_THROTTLE / DRIVE_STEER, DRIVE_LEVEL_*,
   * and {@link encodeDriveState}. The app re-asserts the FULL state on every
   * change and on a fixed cadence; the firmware treats a non-neutral throttle as
   * valid only for MOTION_LEASE_MS since the last dv frame, then coasts to
   * neutral. This replaces BOTH the old edge-triggered drive buttons ('db'
   * press/release events — a lost release frame meant a runaway car) and the old
   * 'kp' keep-alive (liveness inference that both false-tripped and kept a stale
   * throttle alive). There is deliberately NO keep-alive concept anywhere in this
   * protocol: the only thing that keeps the car moving is the operator's finger,
   * restated a few times a second.
   */
  DRIVE_STATE: 'dv',
  STEER_CALIBRATE: 'sc',
  STOP: 'st',
  SPEED_FACTOR: 'sf',
  // Arduino options
  RANGE_SENSORS: 'rs',
  RANGE_SERVO_ANGLE: 'rc',
  CAR_LIGHTS: 'cl',
  BLINKERS: 'bl',
  ALL_BLINKERS: 'b4',
  LONG_LIGHTS: 'll',
  /**
   * Bottom LED strip ("underglow") colour. Unlike every other command its value
   * is compound — "<r>,<b>" (e.g. 'lc255,64') — because the strip is wired to
   * only two PWM channels (red + blue; there is no green). The app owns the
   * colour maths (src/utils/underglow.ts) and sends raw channel values; the
   * firmware just analogWrites them. Pure red is reserved for the stop/brake
   * alert, so the picker never produces it.
   */
  UNDERGLOW_COLOR: 'lc',
} as const;

export type CommandCode = (typeof COMMAND_CODES)[keyof typeof COMMAND_CODES];

/** Throttle component of a drive-state ('dv') frame. */
export const DRIVE_THROTTLE = {
  FORWARD: 'f',
  NEUTRAL: 'n',
  REVERSE: 'b',
} as const;
export type ThrottleState = (typeof DRIVE_THROTTLE)[keyof typeof DRIVE_THROTTLE];

/** Steering component of a drive-state ('dv') frame. */
export const DRIVE_STEER = {
  LEFT: 'l',
  CENTER: 'c',
  RIGHT: 'r',
} as const;
export type SteerState = (typeof DRIVE_STEER)[keyof typeof DRIVE_STEER];

/**
 * Forward throttle magnitude carried by a 'dv' frame ("dvfc80" = forward,
 * centre, 80%). Only the FORWARD throttle carries a level; neutral and reverse
 * never do. The app quantizes to DRIVE_LEVEL_STEP and never emits a forward
 * frame below one step (it sends neutral instead — see src/utils/drive-state.ts).
 * The firmware maps 0..100 linearly onto the ESC angle 90 (idle) .. speedFactor.
 */
export const DRIVE_LEVEL_MIN = 0;
export const DRIVE_LEVEL_MAX = 100;
export const DRIVE_LEVEL_STEP = 5;

/**
 * Motion-lease timings (ms). These three numbers are a tuned set — change them
 * together or not at all:
 *  - MOTION_LEASE_MS: how long the firmware honours a non-neutral throttle
 *    without a fresh dv frame before coasting to neutral. The firmware has its
 *    own copy (`motionLeaseMs` in arduino/rc-car/rc-car.ino) that MUST match.
 *  - ACTIVE refresh: dv cadence while any control is engaged — 4 consecutive
 *    lost/late frames before the car coasts, and dense enough uplink traffic to
 *    keep the phone's Wi-Fi radio out of power-save while driving.
 *  - IDLE refresh: dv cadence while everything is neutral. Not a safety signal
 *    (a parked car needs no lease) — it only keeps the radio awake through
 *    driving pauses so the first press afterwards reacts instantly.
 */
export const MOTION_LEASE_MS = 600;
export const DRIVE_STATE_ACTIVE_REFRESH_MS = 150;
export const DRIVE_STATE_IDLE_REFRESH_MS = 1000;

/** Build the body of a drive-state command, e.g. ('f','c',80) -> 'dvfc80'. The
 * level is appended only for a FORWARD throttle and is clamped to 0..100; a
 * missing level (or any non-forward throttle) yields the bare frame, e.g.
 * ('n','l') -> 'dvnl'. */
export function encodeDriveState(
  throttle: ThrottleState,
  steer: SteerState,
  level?: number,
): string {
  const base = `${COMMAND_CODES.DRIVE_STATE}${throttle}${steer}`;
  if (throttle === DRIVE_THROTTLE.FORWARD && level !== undefined) {
    const clamped = Math.max(DRIVE_LEVEL_MIN, Math.min(DRIVE_LEVEL_MAX, Math.round(level)));
    return `${base}${clamped}`;
  }
  return base;
}

/**
 * Telemetry the car streams back to the app (car -> app).
 *
 * `rs` (RANGE_SENSOR_PROBLEM) is the one telemetry code that shares its two
 * letters with a command (`rs` = RANGE_SENSORS app->car); the direction-aware
 * name maps below keep them distinct. The firmware emits `rs1` when the front
 * obstacle brake engages and `rs0` when the path clears (edge-triggered, so it
 * does not flood the link); it streams on the same `wsReceive` bus as the
 * gauges for any indicator that wants to subscribe.
 */
export const TELEMETRY_CODES = {
  MOTOR_TEMP: 'mt',
  SPEED: 'sp',
  BATTERY_VOLTAGE: 'bv',
  RANGE_SENSOR_PROBLEM: 'rs',
  /**
   * Boot beacon. The firmware emits `rb1` once at the end of `setup()`, i.e. on
   * every (re)boot. A brown-out reset reverts the car to its power-on defaults
   * but the app<->server socket never drops, so this is the app's only reliable
   * signal that the car restarted and its saved settings need replaying.
   */
  CAR_BOOT: 'rb',
} as const;

export type TelemetryCode = (typeof TELEMETRY_CODES)[keyof typeof TELEMETRY_CODES];

/** code -> human name, e.g. 'cl' -> 'CAR_LIGHTS'. Built once from the maps above. */
const COMMAND_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(COMMAND_CODES).map(([name, code]) => [code, name]),
);
const TELEMETRY_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(TELEMETRY_CODES).map(([name, code]) => [code, name]),
);

/**
 * Human-readable name for an app->car command code (e.g. 'cl' -> 'CAR_LIGHTS'),
 * or undefined if the code is unknown. Direction-specific so the `rs`/`sp`
 * codes that mean different things each way resolve correctly.
 */
export function commandName(code: string): string | undefined {
  return COMMAND_NAMES[code];
}

/** Human-readable name for a car->app telemetry code (e.g. 'bv' -> 'BATTERY_VOLTAGE'). */
export function telemetryName(code: string): string | undefined {
  return TELEMETRY_NAMES[code];
}

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
