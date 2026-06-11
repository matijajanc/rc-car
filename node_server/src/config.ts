/**
 * Environment-driven configuration for the bridge server.
 *
 * Everything that used to be hardcoded in server.js (the COM4 path, the 19200
 * baud rate, the 8085 port) is now read from the environment with sane
 * defaults, so the same image runs on a developer laptop, in CI, and on the
 * machine physically wired to the car.
 */

export interface ServerConfig {
  /** WebSocket port the app connects to. Matches WS_PORT in the app's .env. */
  wsPort: number;
  /** Interface to bind. 0.0.0.0 so a phone on the same LAN can reach it. */
  host: string;
  /** When true, no real hardware is touched — a virtual car is used instead. */
  simulate: boolean;
  /** Serial device path for the real car (only used when simulate is false). */
  serialPath: string;
  /** Serial baud rate for the real car. */
  serialBaud: number;
}

function envInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected an integer but got "${value}"`);
  }
  return parsed;
}

function envBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

/** A reasonable default serial path per platform; override with SERIAL_PATH. */
function defaultSerialPath(platform: NodeJS.Platform): string {
  switch (platform) {
    case 'win32':
      return 'COM3';
    case 'darwin':
      return '/dev/tty.usbserial';
    default:
      return '/dev/ttyUSB0';
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): ServerConfig {
  return {
    wsPort: envInt(env.WS_PORT, 8085),
    host: env.WS_HOST ?? '0.0.0.0',
    // Simulate by default so `npm run dev` and CI never need real hardware.
    simulate: envBool(env.SIMULATE, true),
    serialPath: env.SERIAL_PATH ?? defaultSerialPath(platform),
    serialBaud: envInt(env.SERIAL_BAUD, 19200),
  };
}
