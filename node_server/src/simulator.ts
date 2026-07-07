import {
  COMMAND_CODES,
  DRIVE_THROTTLE,
  MOTION_LEASE_MS,
  TELEMETRY_CODES,
  TELEMETRY_TERMINATOR,
  parseCommandStream,
} from '../../shared/protocol';
import { CarLink, Emitter } from './link';

export interface SimulatorOptions {
  /** How often a speed frame is emitted (ms). */
  speedIntervalMs?: number;
  /** How often a battery-voltage frame is emitted (ms). */
  batteryIntervalMs?: number;
  /** How often a motor-temperature frame is emitted (ms). */
  tempIntervalMs?: number;
  /**
   * How often the virtual car re-rolls whether the front range sensor sees an
   * obstacle. It emits an `rs` frame only when that state flips (edge-triggered,
   * like the firmware). 0 disables range-sensor telemetry.
   */
  rangeProblemIntervalMs?: number;
  /**
   * Motion lease: how long a non-neutral throttle stays valid without a fresh
   * drive-state ('dv') frame before the virtual car coasts to neutral,
   * mirroring the firmware's dead-man. 0 disables the check.
   */
  motionLeaseMs?: number;
  /** Injectable RNG for deterministic tests. Defaults to Math.random. */
  random?: () => number;
  /** Injectable clock for deterministic tests. Defaults to Date.now. */
  now?: () => number;
  /** Where to log received commands. Defaults to console.log. */
  logger?: (message: string) => void;
}

const DEFAULTS: Required<Omit<SimulatorOptions, 'random' | 'now' | 'logger'>> = {
  speedIntervalMs: 500,
  batteryIntervalMs: 5000,
  tempIntervalMs: 7000,
  rangeProblemIntervalMs: 4000,
  motionLeaseMs: MOTION_LEASE_MS,
};

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * An in-process virtual RC car. It streams telemetry exactly like the Arduino
 * would (`<code><value>X`) and consumes commands, so the entire app + server
 * stack can be exercised with no serial hardware attached.
 *
 * Telemetry value ranges match the original development-only simulation that
 * was commented out at the bottom of the legacy server.js.
 */
export class CarSimulator implements CarLink {
  private readonly opts: Required<Omit<SimulatorOptions, 'random' | 'now' | 'logger'>>;
  private readonly random: () => number;
  private readonly now: () => number;
  private readonly logger: (message: string) => void;

  private readonly data = new Emitter<string>();
  private readonly errors = new Emitter<Error>();
  private readonly closes = new Emitter<void>();

  private timers: ReturnType<typeof setInterval>[] = [];
  private commandBuffer = '';
  private speed = 0;
  private rangeProblem = false;
  private throttle: string = DRIVE_THROTTLE.NEUTRAL;
  private lastDriveStateAt = 0;
  private lastLoggedCommand = '';
  private running = false;

  constructor(options: SimulatorOptions = {}) {
    this.opts = {
      speedIntervalMs: options.speedIntervalMs ?? DEFAULTS.speedIntervalMs,
      batteryIntervalMs: options.batteryIntervalMs ?? DEFAULTS.batteryIntervalMs,
      tempIntervalMs: options.tempIntervalMs ?? DEFAULTS.tempIntervalMs,
      rangeProblemIntervalMs: options.rangeProblemIntervalMs ?? DEFAULTS.rangeProblemIntervalMs,
      motionLeaseMs: options.motionLeaseMs ?? DEFAULTS.motionLeaseMs,
    };
    this.random = options.random ?? Math.random;
    this.now = options.now ?? Date.now;
    this.logger = options.logger ?? ((message) => console.log(message));
  }

  open(): Promise<void> {
    this.running = true;
    this.lastDriveStateAt = this.now();

    this.timers.push(
      setInterval(() => this.emitSpeed(), this.opts.speedIntervalMs),
      setInterval(
        () => this.send(TELEMETRY_CODES.BATTERY_VOLTAGE, randomInt(this.random, 435, 675)),
        this.opts.batteryIntervalMs,
      ),
      setInterval(
        () => this.send(TELEMETRY_CODES.MOTOR_TEMP, randomInt(this.random, 1, 100)),
        this.opts.tempIntervalMs,
      ),
    );
    if (this.opts.rangeProblemIntervalMs > 0) {
      this.timers.push(
        setInterval(() => this.emitRangeProblem(), this.opts.rangeProblemIntervalMs),
      );
    }
    // Don't let these timers keep the process alive on their own.
    this.timers.forEach((timer) => timer.unref?.());
    this.logger('[simulator] virtual car online');
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.running = false;
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers = [];
    this.data.clear();
    this.closes.emit();
    return Promise.resolve();
  }

  write(frame: string): void {
    this.commandBuffer += frame;
    const { items, rest } = parseCommandStream(this.commandBuffer);
    this.commandBuffer = rest;
    for (const command of items) {
      this.handleCommand(command);
    }
  }

  onData(listener: (chunk: string) => void): void {
    this.data.add(listener);
  }

  onError(listener: (error: Error) => void): void {
    this.errors.add(listener);
  }

  onClose(listener: () => void): void {
    this.closes.add(listener);
  }

  /** Emit a single telemetry frame to all data listeners. */
  private send(code: string, value: string | number): void {
    if (!this.running) {
      return;
    }
    this.data.emit(`${code}${value}${TELEMETRY_TERMINATOR}`);
  }

  private emitSpeed(): void {
    // Motion lease, exactly like the firmware: a non-neutral throttle without a
    // fresh dv frame within the lease window coasts to neutral.
    if (
      this.throttle !== DRIVE_THROTTLE.NEUTRAL &&
      this.opts.motionLeaseMs > 0 &&
      this.now() - this.lastDriveStateAt > this.opts.motionLeaseMs
    ) {
      this.throttle = DRIVE_THROTTLE.NEUTRAL;
      this.logger('[simulator] motion lease expired — coasting to neutral');
    }
    // Crude vehicle model: ramp toward a cruising speed while the throttle is
    // engaged, coast down toward 0 when it isn't.
    if (this.throttle === DRIVE_THROTTLE.FORWARD) {
      this.speed = Math.min(45, this.speed + 8);
    } else if (this.throttle === DRIVE_THROTTLE.REVERSE) {
      this.speed = Math.min(15, this.speed + 5);
    } else {
      this.speed = Math.max(0, this.speed - 15);
    }
    this.send(TELEMETRY_CODES.SPEED, this.speed);
  }

  /**
   * Re-roll the virtual front-obstacle state and emit an `rs` frame only when it
   * changes, the same edge-triggered way the firmware reports its brake state.
   */
  private emitRangeProblem(): void {
    const present = this.random() < 0.25;
    if (present === this.rangeProblem) {
      return;
    }
    this.rangeProblem = present;
    this.send(TELEMETRY_CODES.RANGE_SENSOR_PROBLEM, present ? 1 : 0);
  }

  /** React to a decoded command body the way a real car roughly would. */
  private handleCommand(command: string): void {
    const code = command.slice(0, 2);
    // The drive state repeats several times a second while a control is held;
    // echoing each refresh floods debug logs, so log only when it changes.
    if (command !== this.lastLoggedCommand) {
      this.lastLoggedCommand = command;
      this.logger(`[simulator] <- ${command}`);
    }
    switch (code) {
      case COMMAND_CODES.DRIVE_STATE: {
        // "dv<throttle><steer>" — accept only well-formed frames, like the
        // firmware (garbage must never extend the motion lease).
        const throttle = command[2];
        if (
          throttle === DRIVE_THROTTLE.FORWARD ||
          throttle === DRIVE_THROTTLE.NEUTRAL ||
          throttle === DRIVE_THROTTLE.REVERSE
        ) {
          this.throttle = throttle;
          this.lastDriveStateAt = this.now();
        }
        break;
      }
      case COMMAND_CODES.STOP:
        this.throttle = DRIVE_THROTTLE.NEUTRAL;
        this.speed = 0;
        break;
      default:
        // Settings/calibration commands have no effect on telemetry.
        break;
    }
  }
}
