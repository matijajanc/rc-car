import {
  CODE_LENGTH,
  COMMAND_CODES,
  COMMAND_TERMINATOR,
  TELEMETRY_CODES,
  TELEMETRY_TERMINATOR,
  commandName,
  decodeTelemetryFrame,
  encodeCommand,
  formatSettingValue,
  frameCommand,
  parseCommandStream,
  parseTelemetryStream,
  telemetryName,
} from '../../shared/protocol';

describe('code tables', () => {
  it('every command and telemetry code is exactly two characters', () => {
    for (const code of Object.values(COMMAND_CODES)) {
      expect(code).toHaveLength(CODE_LENGTH);
    }
    for (const code of Object.values(TELEMETRY_CODES)) {
      expect(code).toHaveLength(CODE_LENGTH);
    }
  });
});

describe('encodeCommand', () => {
  it('returns the bare code when there is no value', () => {
    expect(encodeCommand(COMMAND_CODES.KEEP_ALIVE)).toBe('kp');
    expect(encodeCommand('st', undefined)).toBe('st');
  });

  it('appends string and numeric values', () => {
    expect(encodeCommand('sp', 120)).toBe('sp120');
    expect(encodeCommand('bl', 1)).toBe('bl1');
    expect(encodeCommand('sf', '0')).toBe('sf0');
  });
});

describe('frameCommand', () => {
  it('appends exactly one command terminator', () => {
    expect(frameCommand('kp')).toBe(`kp${COMMAND_TERMINATOR}`);
    expect(frameCommand('sp', 95)).toBe(`sp95${COMMAND_TERMINATOR}`);
  });

  it('round-trips back through parseCommandStream', () => {
    const wire = frameCommand('sp', 110);
    const { items, rest } = parseCommandStream(wire);
    expect(items).toEqual(['sp110']);
    expect(rest).toBe('');
  });
});

describe('decodeTelemetryFrame', () => {
  it('parses a code and value up to the X terminator', () => {
    expect(decodeTelemetryFrame('sp45X')).toEqual({ code: 'sp', value: '45' });
    expect(decodeTelemetryFrame('bv550X')).toEqual({ code: 'bv', value: '550' });
  });

  it('tolerates a missing terminator (legacy receiver behaviour)', () => {
    expect(decodeTelemetryFrame('mt37')).toEqual({ code: 'mt', value: '37' });
  });

  it('returns null when there is no parseable code', () => {
    expect(decodeTelemetryFrame('X')).toBeNull();
    expect(decodeTelemetryFrame('a')).toBeNull();
    expect(decodeTelemetryFrame('')).toBeNull();
  });
});

describe('parseTelemetryStream', () => {
  it('splits multiple frames and keeps the unterminated tail', () => {
    const { items, rest } = parseTelemetryStream('sp10Xbv500Xmt3');
    expect(items).toEqual([
      { code: 'sp', value: '10' },
      { code: 'bv', value: '500' },
    ]);
    expect(rest).toBe('mt3');
  });

  it('reassembles a frame split across two chunks', () => {
    const first = parseTelemetryStream('sp10Xmt3');
    expect(first.items).toEqual([{ code: 'sp', value: '10' }]);
    expect(first.rest).toBe('mt3');

    const second = parseTelemetryStream(first.rest + `7${TELEMETRY_TERMINATOR}`);
    expect(second.items).toEqual([{ code: 'mt', value: '37' }]);
    expect(second.rest).toBe('');
  });

  it('drops segments too short to contain a code', () => {
    const { items } = parseTelemetryStream('sp10XzXbv9X');
    expect(items).toEqual([
      { code: 'sp', value: '10' },
      { code: 'bv', value: '9' },
    ]);
  });
});

describe('parseCommandStream', () => {
  it('splits on the newline terminator and drops empty segments', () => {
    const { items, rest } = parseCommandStream('kp\n\nst\ndb');
    expect(items).toEqual(['kp', 'st']);
    expect(rest).toBe('db');
  });
});

describe('commandName / telemetryName', () => {
  it('maps codes back to their human-readable names', () => {
    expect(commandName(COMMAND_CODES.SPEED_FACTOR)).toBe('SPEED_FACTOR');
    expect(commandName(COMMAND_CODES.CAR_LIGHTS)).toBe('CAR_LIGHTS');
    expect(commandName(COMMAND_CODES.KEEP_ALIVE)).toBe('KEEP_ALIVE');
    expect(telemetryName(TELEMETRY_CODES.SPEED)).toBe('SPEED');
    expect(telemetryName(TELEMETRY_CODES.BATTERY_VOLTAGE)).toBe('BATTERY_VOLTAGE');
  });

  it('resolves the shared codes per direction', () => {
    // 'rs' means RANGE_SENSORS as a command but RANGE_SENSOR_PROBLEM as telemetry.
    expect(commandName('rs')).toBe('RANGE_SENSORS');
    expect(telemetryName('rs')).toBe('RANGE_SENSOR_PROBLEM');
  });

  it('returns undefined for unknown codes', () => {
    expect(commandName('zz')).toBeUndefined();
    expect(telemetryName('zz')).toBeUndefined();
  });
});

describe('formatSettingValue', () => {
  it('maps booleans (and their string forms) to 1/0', () => {
    expect(formatSettingValue(true)).toBe(1);
    expect(formatSettingValue('true')).toBe(1);
    expect(formatSettingValue(false)).toBe(0);
    expect(formatSettingValue('false')).toBe(0);
  });

  it('passes other values through unchanged', () => {
    expect(formatSettingValue('120')).toBe('120');
    expect(formatSettingValue(95)).toBe(95);
  });
});
