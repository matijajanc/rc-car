import {
  COMMAND_CODES,
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
   * If no keep-alive ('kp') arrives within this window the virtual car stops,
   * mirroring the real car's safety behaviour. 0 disables the check.
   */
  keepAliveTimeoutMs?: number;
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
  keepAliveTimeoutMs: 400,
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
  private lastKeepAlive = 0;
  private running = false;

  constructor(options: SimulatorOptions = {}) {
    this.opts = {
      speedIntervalMs: options.speedIntervalMs ?? DEFAULTS.speedIntervalMs,
      batteryIntervalMs: options.batteryIntervalMs ?? DEFAULTS.batteryIntervalMs,
      tempIntervalMs: options.tempIntervalMs ?? DEFAULTS.tempIntervalMs,
      rangeProblemIntervalMs: options.rangeProblemIntervalMs ?? DEFAULTS.rangeProblemIntervalMs,
      keepAliveTimeoutMs: options.keepAliveTimeoutMs ?? DEFAULTS.keepAliveTimeoutMs,
    };
    this.random = options.random ?? Math.random;
    this.now = options.now ?? Date.now;
    this.logger = options.logger ?? ((message) => console.log(message));
  }

  open(): Promise<void> {
    this.running = true;
    this.lastKeepAlive = this.now();

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
    // Safety: if the controller stops sending keep-alives, the car stops.
    if (
      this.opts.keepAliveTimeoutMs > 0 &&
      this.now() - this.lastKeepAlive > this.opts.keepAliveTimeoutMs
    ) {
      this.speed = 0;
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
    // The keep-alive is a 10Hz heartbeat; echoing each one floods debug logs
    // (the server already coalesces keep-alives in its verbose trace).
    if (code !== COMMAND_CODES.KEEP_ALIVE) {
      this.logger(`[simulator] <- ${command}`);
    }
    switch (code) {
      case COMMAND_CODES.KEEP_ALIVE:
        this.lastKeepAlive = this.now();
        break;
      case COMMAND_CODES.STOP:
        this.speed = 0;
        break;
      case COMMAND_CODES.DRIVE_BUTTONS:
        // Any drive input nudges the virtual speed up to a cruising value.
        this.speed = Math.min(45, this.speed + 5);
        break;
      default:
        // Settings/calibration commands have no effect on telemetry.
        break;
    }
  }
}
