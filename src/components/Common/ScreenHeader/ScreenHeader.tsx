import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radius, fontSize, fontWeight, screenPad } from '../../../config/styles/theme';

interface Props {
  title: string;
  /** Optional override; defaults to navigation.goBack(). */
  onBack?: () => void;
  /** Optional trailing content (e.g. an action button). */
  right?: React.ReactNode;
}

/** Consistent back-chevron + title header for the secondary screens. */
export default function ScreenHeader({ title, onBack, right }: Props): React.JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const goBack = onBack ?? (() => navigation.goBack());

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7} hitSlop={8}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 5l-7 7 7 7"
            stroke={colors.textPrimary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPad,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
