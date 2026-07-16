import {
  CODE_LENGTH,
  COMMAND_CODES,
  COMMAND_TERMINATOR,
  DRIVE_LEVEL_MAX,
  DRIVE_LEVEL_MIN,
  DRIVE_LEVEL_STEP,
  DRIVE_STEER,
  DRIVE_THROTTLE,
  TELEMETRY_CODES,
  TELEMETRY_TERMINATOR,
  commandName,
  decodeTelemetryFrame,
  encodeCommand,
  encodeDriveState,
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
    expect(encodeCommand(COMMAND_CODES.STOP)).toBe('st');
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
    expect(frameCommand('st')).toBe(`st${COMMAND_TERMINATOR}`);
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
    const { items, rest } = parseCommandStream('dvfc\n\nst\ndv');
    expect(items).toEqual(['dvfc', 'st']);
    expect(rest).toBe('dv');
  });
});

describe('drive state (dv)', () => {
  it('encodes the absolute throttle+steer state', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER)).toBe('dvfc');
    expect(encodeDriveState(DRIVE_THROTTLE.NEUTRAL, DRIVE_STEER.LEFT)).toBe('dvnl');
    expect(encodeDriveState(DRIVE_THROTTLE.REVERSE, DRIVE_STEER.RIGHT)).toBe('dvbr');
  });

  it('round-trips through the command wire format', () => {
    const wire = frameCommand(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.RIGHT));
    expect(wire).toBe('dvfr\n');
    const { items } = parseCommandStream(wire);
    expect(items).toEqual(['dvfr']);
  });

  it('maps the code back to its name', () => {
    expect(commandName(COMMAND_CODES.DRIVE_STATE)).toBe('DRIVE_STATE');
  });

  it('appends a forward level and clamps it to 0..100', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, 80)).toBe('dvfc80');
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.LEFT, 0)).toBe('dvfl0');
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, 130)).toBe('dvfc100');
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, -5)).toBe('dvfc0');
  });

  it('never appends a level to neutral or reverse', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.NEUTRAL, DRIVE_STEER.CENTER, 80)).toBe('dvnc');
    expect(encodeDriveState(DRIVE_THROTTLE.REVERSE, DRIVE_STEER.RIGHT, 80)).toBe('dvbr');
  });

  it('omitting the level keeps the bare forward frame (back-compatible)', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER)).toBe('dvfc');
  });

  it('exposes the level quantization constants', () => {
    expect([DRIVE_LEVEL_MIN, DRIVE_LEVEL_MAX, DRIVE_LEVEL_STEP]).toEqual([0, 100, 5]);
  });
});

describe('commandName / telemetryName', () => {
  it('maps codes back to their human-readable names', () => {
    expect(commandName(COMMAND_CODES.SPEED_FACTOR)).toBe('SPEED_FACTOR');
    expect(commandName(COMMAND_CODES.CAR_LIGHTS)).toBe('CAR_LIGHTS');
    expect(commandName(COMMAND_CODES.DRIVE_STATE)).toBe('DRIVE_STATE');
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

describe('underglow colour command', () => {
  it('frames and round-trips the compound "<r>,<b>" value through the wire', () => {
    const wire = frameCommand(COMMAND_CODES.UNDERGLOW_COLOR, '255,64');
    expect(wire).toBe('lc255,64\n');
    const { items, rest } = parseCommandStream(wire);
    expect(items).toEqual(['lc255,64']);
    expect(rest).toBe('');
  });

  it('maps the code back to its name', () => {
    expect(commandName(COMMAND_CODES.UNDERGLOW_COLOR)).toBe('UNDERGLOW_COLOR');
  });

  it('survives settings replay (the comma value passes through unchanged)', () => {
    expect(formatSettingValue('255,64')).toBe('255,64');
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
