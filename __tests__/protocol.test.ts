import {
  COMMAND_CODES,
  TELEMETRY_CODES,
  frameCommand,
  parseTelemetryStream,
} from '../shared/protocol';

describe('app <-> car protocol', () => {
  it('frames a keep-alive command with the command terminator', () => {
    expect(frameCommand(COMMAND_CODES.KEEP_ALIVE)).toBe('kp\n');
  });

  it('decodes a speed telemetry frame from the car', () => {
    const { items } = parseTelemetryStream('sp42X');
    expect(items).toEqual([{ code: TELEMETRY_CODES.SPEED, value: '42' }]);
  });

  it('frames an underglow colour command with its compound "<r>,<b>" value', () => {
    expect(frameCommand(COMMAND_CODES.UNDERGLOW_COLOR, '255,64')).toBe('lc255,64\n');
  });
});
