// Shared design tokens for the modernised UI (everything except the gauges).
// Components import { colors, spacing, radius, fontSize, fontWeight } from here
// so spacing/typography/corner-radii stay consistent across screens.
import { colors } from './colors';

/** 4-based spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Corner radii — cards are large and soft, controls are pill-shaped. */
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

/** Type scale. */
export const fontSize = {
  display: 44,
  title: 28,
  heading: 22,
  subtitle: 17,
  body: 16,
  label: 14,
  caption: 12,
  overline: 11,
} as const;

/** Font weights, typed as the literals React Native's `fontWeight` expects. */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Default horizontal padding for full-screen content. */
export const screenPad = 20;

export { colors };
