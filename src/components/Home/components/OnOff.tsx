import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './assets/styles/styles';
import OnOffSetting from '../../Common/Onoff-setting/OnOffSetting';

interface Props {
  text: string;
  setting: string;
  icon: React.ReactNode;
  /** Draw a hairline divider above the row (every row except the first). */
  divider?: boolean;
}

const OnOff = ({ text, setting, icon, divider }: Props): React.JSX.Element => (
  <View style={[styles.row, divider && styles.rowDivider]}>
    <View style={styles.rowInner}>
      {icon}
      <Text style={styles.name}>{text}</Text>
      <OnOffSetting setting={setting} />
    </View>
  </View>
);

export default OnOff;
