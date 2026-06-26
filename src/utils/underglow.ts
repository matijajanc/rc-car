/**
 * Bottom LED strip ("underglow") colour maths.
 *
 * The strip is wired to only TWO PWM channels in the firmware — red (pin 5) and
 * blue (pin 6); there is no green. So the reachable gamut is exactly the
 * blue↔red half of the hue wheel (hue 240°→360°), across which a real HSV→RGB
 * conversion keeps green at 0 anyway — meaning the slider is an honest hue
 * picker, not a fake one. We stop short of pure red (hue 345°) so a custom glow
 * can never be mistaken for the firmware's stop/brake alert, which forces the
 * strip fully red.
 *
 * The app owns all of this; it sends the car raw channel values
 * ("lc<r>,<b>", UNDERGLOW_COLOR) and the firmware just analogWrites them.
 */

/** A point in the strip's two-channel colour space. Green is always absent. */
export interface Channels {
  /** Red channel PWM, 0–255 (pin 5). */
  r: number;
  /** Blue channel PWM, 0–255 (pin 6). */
  b: number;
}

/** Hue (degrees) at slider position 0 — pure blue. */
const HUE_START = 240;
/** Hue (degrees) at slider position 1 — deep pink, just shy of pure red. */
const HUE_END = 345;

/** Default glow: the original firmware blue (red 0, blue 255). */
export const DEFAULT_CHANNELS: Channels = { r: 0, b: 255 };

const clampByte = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Map a slider position (0..1) to red/blue channel values by walking the
 * reachable hue arc. Green is structurally 0 across this whole arc, so the
 * standard HSV→RGB reduces to two channels.
 */
export function positionToChannels(position: number): Channels {
  const hue = HUE_START + clamp01(position) * (HUE_END - HUE_START); // 240..345
  if (hue <= 300) {
    // 240→300: blue holds at full, red rises (blue → magenta).
    return { r: clampByte((255 * (hue - 240)) / 60), b: 255 };
  }
  // 300→345: red holds at full, blue falls (magenta → deep pink).
  return { r: 255, b: clampByte((255 * (360 - hue)) / 60) };
}

/**
 * Inverse of {@link positionToChannels}: recover the slider position for a
 * stored colour so the control restores where the user left it. Assumes the
 * channels lie on the arc the slider produces (our own persisted values always
 * do); off-arc inputs snap to the nearest arc position.
 */
export function channelsToPosition(channels: Channels): number {
  const r = clampByte(channels.r);
  const b = clampByte(channels.b);
  // On the first half of the arc blue is pinned at full; once red saturates we
  // are on the second half, where blue is the thing that varies.
  const hue = r >= 255 ? 360 - (60 * b) / 255 : 240 + (60 * r) / 255;
  return clamp01((hue - HUE_START) / (HUE_END - HUE_START));
}

/** Build the wire value for UNDERGLOW_COLOR: "<r>,<b>" (e.g. "255,64"). */
export function channelsToWire(channels: Channels): string {
  return `${clampByte(channels.r)},${clampByte(channels.b)}`;
}

/**
 * Parse a persisted/wire "<r>,<b>" value back to channels, or null if it is not
 * two comma-separated bytes. Used when restoring `setting-lc` on mount.
 */
export function parseChannels(value: string): Channels | null {
  const match = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/.exec(value);
  if (!match) {
    return null;
  }
  return { r: clampByte(Number(match[1])), b: clampByte(Number(match[2])) };
}

/**
 * CSS hex (#RRGGBB) for previewing the colour in the UI. Green is forced to 00
 * so the swatch shows exactly what the two-channel strip will display.
 */
export function channelsToHex(channels: Channels): string {
  const hex = (n: number): string => clampByte(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${hex(channels.r)}00${hex(channels.b)}`;
}
