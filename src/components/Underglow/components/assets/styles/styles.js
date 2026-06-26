import { StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  screenPad,
} from '../../../../../config/styles/theme';

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: screenPad, paddingTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  swatch: {
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    // Soft halo in the live colour (shadowColor is set inline per-colour).
    shadowOpacity: 0.9,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  hex: {
    color: colors.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xl,
  },
  channels: {
    color: colors.textMuted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    letterSpacing: 1,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  spectrum: {
    width: '100%',
    marginTop: spacing.xxl,
    borderRadius: 7,
    overflow: 'hidden',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.label,
    lineHeight: 20,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
    textAlign: 'center',
  },
});

export default styles;
