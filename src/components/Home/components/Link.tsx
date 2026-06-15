import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { styles } from './assets/styles/styles';
import { colors } from '../../../config/styles/colors';
import ChevronIcon from './icons/Chevron-icon';

interface Props {
  text: string;
  navigate: () => void;
  icon: React.ReactNode;
  /** Optional trailing value shown before the chevron (e.g. current setting). */
  value?: string;
  /** Draw a hairline divider above the row (every row except the first). */
  divider?: boolean;
}

const Link = ({ text, navigate, icon, value, divider }: Props): React.JSX.Element => (
  <TouchableHighlight
    style={[styles.row, divider && styles.rowDivider]}
    underlayColor={colors.surfacePressed}
    onPress={() => navigate()}>
    <View style={styles.rowInner}>
      {icon}
      <Text style={styles.name}>{text}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <ChevronIcon />
    </View>
  </TouchableHighlight>
);

export default Link;
