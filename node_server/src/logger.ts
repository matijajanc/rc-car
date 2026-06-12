import { createWriteStream, mkdirSync, readdirSync, unlinkSync, WriteStream } from 'node:fs';
import { join } from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogEntry {
  ts: string;
  level: LogLevel;
  /** Where it came from: 'ws' | 'serial' | 'sim' | 'server' | 'http' */
  src: string;
  /** Short machine-friendly event name, e.g. 'client_connected'. */
  event: string;
  /** Optional structured fields (error message, codes, counts, ...). */
  [key: string]: unknown;
}

export interface LoggerOptions {
  level?: LogLevel;
  /** Directory for JSON-lines files; null/'' disables file output. */
  dir?: string | null;
  toConsole?: boolean;
  /** Max entries kept in memory for the /logs endpoint. */
  bufferSize?: number;
  /** Delete day-files older than this many days (0 disables). */
  retentionDays?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

/**
 * Tiny dependency-free structured logger: pretty lines to the console, JSON
 * lines to a daily-rotating file, and an in-memory ring buffer the HTTP /logs
 * endpoint serves. One JSON object per line so logs are greppable with `jq`.
 */
export class Logger {
  private readonly minWeight: number;
  private readonly toConsole: boolean;
  private readonly bufferSize: number;
  private readonly retentionDays: number;
  private readonly now: () => Date;
  private readonly dir: string | null;

  private readonly buffer: LogEntry[] = [];
  private stream: WriteStream | null = null;
  private streamDay = '';

  constructor(options: LoggerOptions = {}) {
    this.minWeight = LEVEL_WEIGHT[options.level ?? 'info'];
    this.toConsole = options.toConsole ?? true;
    this.bufferSize = options.bufferSize ?? 500;
    this.retentionDays = options.retentionDays ?? 7;
    this.now = options.now ?? (() => new Date());
    this.dir = options.dir && options.dir.trim() !== '' ? options.dir : null;
  }

  debug(src: string, event: string, fields?: Record<string, unknown>): void {
    this.write('debug', src, event, fields);
  }
  info(src: string, event: string, fields?: Record<string, unknown>): void {
    this.write('info', src, event, fields);
  }
  warn(src: string, event: string, fields?: Record<string, unknown>): void {
    this.write('warn', src, event, fields);
  }
  error(src: string, event: string, fields?: Record<string, unknown>): void {
    this.write('error', src, event, fields);
  }

  /** Most recent entries, newest last, optionally filtered by minimum level. */
  recent(limit = 200, minLevel?: LogLevel): LogEntry[] {
    const floor = minLevel ? LEVEL_WEIGHT[minLevel] : 0;
    const filtered = floor
      ? this.buffer.filter((e) => LEVEL_WEIGHT[e.level] >= floor)
      : this.buffer;
    const n = Math.max(0, limit);
    return n === 0 ? [] : filtered.slice(-n);
  }

  close(): void {
    this.stream?.end();
    this.stream = null;
  }

  private write(
    level: LogLevel,
    src: string,
    event: string,
    fields?: Record<string, unknown>,
  ): void {
    if (LEVEL_WEIGHT[level] < this.minWeight) {
      return;
    }
    const date = this.now();
    const entry: LogEntry = { ts: date.toISOString(), level, src, event, ...fields };

    this.buffer.push(entry);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    this.fileStream(date)?.write(`${JSON.stringify(entry)}\n`);

    if (this.toConsole) {
      const detail = entry.msg ? ` — ${String(entry.msg)}` : '';
      const line = `${entry.ts} ${level.toUpperCase().padEnd(5)} [${src}] ${event}${detail}`;
      if (level === 'error') {
        console.error(line);
      } else if (level === 'warn') {
        console.warn(line);
      } else {
        console.log(line);
      }
    }
  }

  private fileStream(date: Date): WriteStream | null {
    if (!this.dir) {
      return null;
    }
    const day = date.toISOString().slice(0, 10);
    if (day !== this.streamDay || !this.stream) {
      this.stream?.end();
      mkdirSync(this.dir, { recursive: true });
      this.stream = createWriteStream(join(this.dir, `bridge-${day}.jsonl`), { flags: 'a' });
      this.streamDay = day;
      this.prune(date);
    }
    return this.stream;
  }

  private prune(date: Date): void {
    if (!this.dir || this.retentionDays <= 0) {
      return;
    }
    const cutoff = date.getTime() - this.retentionDays * 86_400_000;
    try {
      for (const name of readdirSync(this.dir)) {
        const match = /^bridge-(\d{4}-\d{2}-\d{2})\.jsonl$/.exec(name);
        if (match && match[1] && Date.parse(match[1]) < cutoff) {
          unlinkSync(join(this.dir, name));
        }
      }
    } catch {
      return; // pruning is best-effort; never let it break logging
    }
  }
}
