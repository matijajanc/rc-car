import { StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, screenPad } from '../../../../../config/styles/theme';

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
  sensorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  angleBox: {
    alignItems: 'center',
  },
  angle: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  angleLabel: {
    color: colors.textMuted,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.semibold,
    letterSpacing: 2,
    marginTop: spacing.xs,
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
