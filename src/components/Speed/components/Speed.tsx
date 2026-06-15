import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import ScreenHeader from '../../Common/ScreenHeader/ScreenHeader';
import { colors, spacing, radius, fontSize, fontWeight, screenPad } from '../../../config/styles/theme';

interface Props {
  settings: { minimumValue: number; maximumValue: number; step: number };
  value: number;
  callback: (value: number) => void;
}

export default function Speed({ settings, value, callback }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Speed" />

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.readoutLabel}>POWER LIMIT</Text>
          <View style={styles.readoutRow}>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.max}>/ {settings.maximumValue}</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={settings.minimumValue}
            maximumValue={settings.maximumValue}
            step={settings.step}
            value={value}
            onSlidingComplete={callback}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.switchTrackOff}
            thumbTintColor={colors.accent}
          />

          <View style={styles.scaleRow}>
            <Text style={styles.scale}>Slow</Text>
            <Text style={styles.scale}>Fast</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Sets the car's maximum motor power. Saved automatically and sent to the car.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: screenPad, paddingTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xxl,
  },
  readoutLabel: {
    color: colors.textMuted,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.6,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  value: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    lineHeight: fontSize.display,
  },
  max: {
    color: colors.textMuted,
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
    marginBottom: 4,
  },
  slider: { width: '100%', height: 40 },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scale: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.label,
    lineHeight: 20,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
});
