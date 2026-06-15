import { StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, screenPad } from '../../../../../config/styles/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: screenPad,
    paddingBottom: spacing.xxxl,
  },
  imageWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  image: {
    alignSelf: 'center',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.6,
    marginLeft: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pin: {
    minWidth: 30,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.label,
  },
  color: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  type: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
});
