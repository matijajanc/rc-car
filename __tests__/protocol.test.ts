import {
  COMMAND_CODES,
  DRIVE_STEER,
  DRIVE_THROTTLE,
  TELEMETRY_CODES,
  encodeDriveState,
  frameCommand,
  parseTelemetryStream,
} from '../shared/protocol';

describe('app <-> car protocol', () => {
  it('frames an absolute drive-state command with the command terminator', () => {
    expect(frameCommand(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER))).toBe(
      'dvfc\n',
    );
  });

  it('decodes a speed telemetry frame from the car', () => {
    const { items } = parseTelemetryStream('sp42X');
    expect(items).toEqual([{ code: TELEMETRY_CODES.SPEED, value: '42' }]);
  });

  it('frames an underglow colour command with its compound "<r>,<b>" value', () => {
    expect(frameCommand(COMMAND_CODES.UNDERGLOW_COLOR, '255,64')).toBe('lc255,64\n');
  });
});
