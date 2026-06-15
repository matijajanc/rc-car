import { StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../../../../config/styles/theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    position: 'absolute',
    top: 72,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.label,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  textInput: {
    fontSize: fontSize.subtitle,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  textInputFocused: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.surfacePressed,
  },
  statusRow: {
    minHeight: 40,
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  statusError: {
    color: colors.dangerUI,
    fontSize: fontSize.label,
    lineHeight: 19,
  },
  statusInfo: {
    color: colors.textSecondary,
    fontSize: fontSize.label,
  },
  button: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.onAccent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  skip: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.label,
  },
});
