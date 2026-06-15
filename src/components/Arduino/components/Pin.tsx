import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './assets/styles/styles';

export interface PinItem {
  pin: number;
  text: string;
  type: string;
  color?: string;
}

interface Props {
  item: PinItem;
  /** Hairline divider above the row (every row except the first in a section). */
  divider?: boolean;
}

/**
 * Displays Arduino pin id, description,
 * color of the wire and pin type (Input/Output)
 */
const Pin = ({ item, divider }: Props): React.JSX.Element => (
  <View style={[styles.listItem, divider && styles.rowDivider]}>
    <Text style={styles.pin}>{item.pin}</Text>
    <Text style={styles.text}>{item.text}</Text>
    {item.color !== undefined && <Text style={styles.color}>{item.color}</Text>}
    <Text style={styles.type}>{item.type}</Text>
  </View>
);

export default Pin;
