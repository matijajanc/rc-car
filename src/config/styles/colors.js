// Palette. The first block is the ORIGINAL set — these exact values are
// consumed by the three gauges (speedometer arc, battery/motor zone colours)
// which must not change, so do not edit them. Everything below is additive
// design-system tokens for the modernised "everything else".
export const colors = {
  // --- legacy / gauge-owned (DO NOT CHANGE THE VALUES) ---
  blue: '#0072FE',
  lightBlue: '#00e0ff',
  background: '#090909',
  button: '#1B95E0',
  switchThumbTintColor: '#fff',
  green: '#0f0',
  orange: '#FFA500',
  red: '#f00',

  // --- surfaces (depth ladder on the near-black background) ---
  surface: '#121417',
  surfaceElevated: '#16191E',
  surfacePressed: '#1F242B',

  // --- borders / hairlines ---
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  hairline: 'rgba(255,255,255,0.06)',

  // --- text ---
  textPrimary: '#F4F6F8',
  textSecondary: '#AEB6C2',
  textMuted: '#6E7682',

  // --- accent (monochrome: colour is reserved for the gauges) ---
  accent: '#EEF2F6', // near-white: active states, focus, hero
  accentDeep: '#9AA4B2', // soft grey companion
  accentSoft: 'rgba(255,255,255,0.10)', // translucent fill behind active items
  accentBorder: 'rgba(255,255,255,0.42)',
  accentGlow: 'rgba(255,255,255,0.16)',
  onAccent: '#0A0B0D', // ink on a near-white accent fill (knobs, glyphs)

  // --- status (UI chrome only; gauges keep the pure green/orange/red above) ---
  successUI: '#34D399',
  warnUI: '#FBBF24',
  dangerUI: '#F87171',

  // --- category badge colours (Home rows; one controlled pop of colour) ---
  catSpeed: '#F7380D',
  catSteer: '#218BEC',
  catSensors: '#67952F',
  catBlinkers: '#F3781E',
  catArduino: '#AF4AD5',

  // --- misc ---
  overlay: 'rgba(0,0,0,0.6)',
  switchTrackOff: '#3A3F47', // off-state track for the monochrome toggle
};
