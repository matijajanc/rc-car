import { Logger, LogLevel } from '../src/logger';

const fixedNow = (): Date => new Date('2026-06-12T09:13:00.000Z');

function makeLogger(level: LogLevel = 'info'): Logger {
  return new Logger({ level, dir: null, toConsole: false, now: fixedNow });
}

describe('Logger', () => {
  it('stamps ISO time, level, src, event, and structured fields', () => {
    const log = makeLogger();
    log.info('ws', 'client_connected', { clients: 1, ip: '10.0.0.5' });
    expect(log.recent()[0]).toMatchObject({
      ts: '2026-06-12T09:13:00.000Z',
      level: 'info',
      src: 'ws',
      event: 'client_connected',
      clients: 1,
      ip: '10.0.0.5',
    });
  });

  it('drops entries below the configured level', () => {
    const log = makeLogger('warn');
    log.info('ws', 'noise');
    log.warn('serial', 'port_error', { msg: 'ENOENT' });
    const recent = log.recent();
    expect(recent).toHaveLength(1);
    expect(recent[0]?.event).toBe('port_error');
  });

  it('filters recent() by a minimum level', () => {
    const log = makeLogger('debug');
    log.debug('sim', 'tick');
    log.error('serial', 'crash');
    expect(log.recent(100, 'error').map((e) => e.event)).toEqual(['crash']);
  });

  it('keeps only the newest entries within the buffer size', () => {
    const log = new Logger({ dir: null, toConsole: false, bufferSize: 2, now: fixedNow });
    log.info('s', 'a');
    log.info('s', 'b');
    log.info('s', 'c');
    expect(log.recent().map((e) => e.event)).toEqual(['b', 'c']);
  });

  it('returns an empty list for limit 0', () => {
    const log = makeLogger();
    log.info('s', 'a');
    expect(log.recent(0)).toEqual([]);
  });
});
