import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './assets/styles/styles';
import Pin from './Pin';
import type { PinItem } from './Pin';

export interface ArduinoSection {
  title: string;
  data: PinItem[];
}

interface Props {
  data: ArduinoSection;
}

const Section = ({ data }: Props): React.JSX.Element => (
  <View style={styles.section}>
    <Text style={styles.sectionHeader}>{data.title}</Text>
    <View style={styles.card}>
      {data.data.map((item, index) => (
        <Pin key={index} item={item} divider={index > 0} />
      ))}
    </View>
  </View>
);

export default Section;
