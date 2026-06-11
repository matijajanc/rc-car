/**
 * A CarLink is anything the bridge can talk to as if it were the car: a real
 * serial port, or the in-process simulator. The server is written against this
 * interface so the two are interchangeable and the data path can be tested
 * without hardware.
 */
export interface CarLink {
  /** Open the link (connect the serial port / start the simulator). */
  open(): Promise<void>;
  /** Close the link and release resources. */
  close(): Promise<void>;
  /** Write a raw, already-framed command toward the car. */
  write(frame: string): void;
  /** Register a listener for raw telemetry chunks coming from the car. */
  onData(listener: (chunk: string) => void): void;
  /** Register a listener for link errors. */
  onError(listener: (error: Error) => void): void;
  /** Register a listener for the link closing. */
  onClose(listener: () => void): void;
}

/**
 * Tiny typed event fan-out shared by the link implementations. Avoids pulling
 * in Node's EventEmitter just for three listener lists and keeps the listener
 * signatures statically checked.
 */
export class Emitter<T> {
  private readonly listeners = new Set<(payload: T) => void>();

  add(listener: (payload: T) => void): void {
    this.listeners.add(listener);
  }

  emit(payload: T): void {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
