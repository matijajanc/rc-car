import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { styles } from './assets/styles/styles';

interface Props {
  text: string;
  navigate: () => void;
  icon: React.ReactNode;
}

const Link = ({ text, navigate, icon }: Props): React.JSX.Element => (
  <TouchableHighlight style={styles.item} onPress={() => navigate()}>
    <View style={styles.itemBox}>
      {icon}
      <Text style={styles.title}>{text}</Text>
    </View>
  </TouchableHighlight>
);

export default Link;
