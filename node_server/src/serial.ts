import { CarLink, Emitter } from './link';

export interface SerialOptions {
  path: string;
  baudRate: number;
  /** Auto-reconnect after an unexpected disconnect (default true). */
  reconnect?: boolean;
  /** First reconnect delay; doubles each attempt up to reconnectMaxMs. */
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  /** Injectable port factory (for tests); defaults to the lazy serialport import. */
  portFactory?: PortFactory;
  /** Optional sink for reconnect lifecycle events. */
  logger?: (event: string, fields?: Record<string, unknown>) => void;
}

/** Minimal shape of the bits of `serialport` we actually use. */
interface SerialPortLike {
  open(callback: (error: Error | null) => void): void;
  close(callback: (error?: Error | null) => void): void;
  write(data: string, callback: (error: Error | null | undefined) => void): void;
  on(event: 'data', listener: (chunk: Buffer) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'close', listener: () => void): void;
}

interface SerialPortConstructor {
  new (options: { path: string; baudRate: number; autoOpen?: boolean }): SerialPortLike;
}

export type PortFactory = (options: { path: string; baudRate: number }) => Promise<SerialPortLike>;

/**
 * Default factory: `serialport` is a native OPTIONAL dependency imported lazily
 * (via a variable specifier so the compiler doesn't require its types), so
 * simulate mode never loads native code and the dev/test workflow always works.
 */
const defaultPortFactory: PortFactory = async ({ path, baudRate }) => {
  const specifier = 'serialport';
  let SerialPort: SerialPortConstructor;
  try {
    const mod = (await import(specifier)) as { SerialPort: SerialPortConstructor };
    SerialPort = mod.SerialPort;
  } catch (error) {
    throw new Error(
      `Cannot open serial port "${path}": the optional 'serialport' dependency is ` +
        `not available. Install it on the machine wired to the car, or run with ` +
        `SIMULATE=true. (${(error as Error).message})`,
    );
  }
  return new SerialPort({ path, baudRate, autoOpen: false });
};

/**
 * Talks to the physical car over a serial port, and survives the cable being
 * unplugged: on an unexpected close it reconnects with exponential backoff,
 * and it starts even if the car isn't connected yet (it keeps retrying).
 */
export class SerialCarLink implements CarLink {
  private port: SerialPortLike | null = null;
  private readonly data = new Emitter<string>();
  private readonly errors = new Emitter<Error>();
  private readonly closes = new Emitter<void>();

  private readonly reconnect: boolean;
  private readonly baseMs: number;
  private readonly maxMs: number;
  private readonly factory: PortFactory;
  private readonly log: (event: string, fields?: Record<string, unknown>) => void;

  private closing = false;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: SerialOptions) {
    this.reconnect = options.reconnect ?? true;
    this.baseMs = options.reconnectBaseMs ?? 1000;
    this.maxMs = options.reconnectMaxMs ?? 30000;
    this.factory = options.portFactory ?? defaultPortFactory;
    this.log = options.logger ?? (() => undefined);
  }

  async open(): Promise<void> {
    this.closing = false;
    try {
      await this.connect();
    } catch (error) {
      if (!this.reconnect) {
        throw error;
      }
      // Start anyway and keep retrying — the car may be plugged in later.
      this.log('open_failed', { msg: (error as Error).message });
      this.scheduleReconnect();
    }
  }

  close(): Promise<void> {
    this.closing = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const port = this.port;
    if (!port) {
      return Promise.resolve();
    }
    this.port = null;
    return new Promise<void>((resolve) => port.close(() => resolve()));
  }

  write(frame: string): void {
    if (!this.port) {
      throw new Error('Serial link is not open');
    }
    this.port.write(frame, (error) => {
      if (error) {
        this.errors.emit(error);
      }
    });
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

  private async connect(): Promise<void> {
    const port = await this.factory({
      path: this.options.path,
      baudRate: this.options.baudRate,
    });
    this.port = port;
    port.on('data', (chunk) => this.data.emit(chunk.toString()));
    port.on('error', (error) => this.errors.emit(error));
    port.on('close', () => this.handlePortClose());
    await new Promise<void>((resolve, reject) => {
      port.open((error) => (error ? reject(error) : resolve()));
    });
    this.attempt = 0;
  }

  private handlePortClose(): void {
    this.closes.emit();
    if (!this.closing && this.reconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.closing || this.reconnectTimer) {
      return;
    }
    this.attempt += 1;
    const delay = Math.min(this.maxMs, this.baseMs * 2 ** (this.attempt - 1));
    this.log('reconnect_scheduled', { attempt: this.attempt, delayMs: delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect()
        .then(() => this.log('reconnected', { attempt: this.attempt }))
        .catch((error: unknown) => {
          this.log('reconnect_failed', { attempt: this.attempt, msg: String(error) });
          this.scheduleReconnect();
        });
    }, delay);
    this.reconnectTimer.unref?.();
  }
}
