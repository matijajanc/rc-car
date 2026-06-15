import { StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, screenPad } from '../../../../../config/styles/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: screenPad,
  },

  // --- header ---
  header: {
    marginBottom: spacing.xl,
  },
  overline: {
    color: colors.textMuted,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.8,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },

  // --- Drive hero ---
  hero: {
    borderRadius: radius.xl,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: fontSize.label,
    marginTop: 3,
  },

  // --- section ---
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.6,
    marginLeft: spacing.xs,
    marginBottom: spacing.md,
  },

  // --- card + rows ---
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  row: {
    // outer touchable: no padding so the divider + highlight span the full width
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    letterSpacing: -0.2,
  },
  value: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
  },

  // --- coloured category badge (consumed by the icon components) ---
  svgBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
