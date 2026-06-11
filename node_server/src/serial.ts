import { CarLink, Emitter } from './link';

export interface SerialOptions {
  path: string;
  baudRate: number;
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

/**
 * Talks to the physical car over a serial port.
 *
 * `serialport` is a native module, so it is an OPTIONAL dependency and is
 * imported lazily — only when we actually need real hardware. Two consequences:
 *   1. Simulate mode (the default) never loads native code, so `npm install`
 *      can fail to build serialport and the dev/test workflow still works.
 *   2. The import specifier is held in a variable on purpose so the compiler
 *      does not try to resolve `serialport`'s types at build time (they may not
 *      be installed). The narrow interfaces above give us back type safety.
 */
export class SerialCarLink implements CarLink {
  private port: SerialPortLike | null = null;
  private readonly data = new Emitter<string>();
  private readonly errors = new Emitter<Error>();
  private readonly closes = new Emitter<void>();

  constructor(private readonly options: SerialOptions) {}

  async open(): Promise<void> {
    const specifier = 'serialport';
    let SerialPort: SerialPortConstructor;
    try {
      const mod = (await import(specifier)) as { SerialPort: SerialPortConstructor };
      SerialPort = mod.SerialPort;
    } catch (error) {
      throw new Error(
        `Cannot open serial port "${this.options.path}": the optional 'serialport' ` +
          `dependency is not available. Install it on the machine wired to the car, ` +
          `or run with SIMULATE=true. (${(error as Error).message})`,
      );
    }

    const port = new SerialPort({
      path: this.options.path,
      baudRate: this.options.baudRate,
      autoOpen: false,
    });
    this.port = port;
    port.on('data', (chunk) => this.data.emit(chunk.toString()));
    port.on('error', (error) => this.errors.emit(error));
    port.on('close', () => this.closes.emit());

    await new Promise<void>((resolve, reject) => {
      port.open((error) => (error ? reject(error) : resolve()));
    });
  }

  close(): Promise<void> {
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
}
