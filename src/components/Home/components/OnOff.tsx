import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './assets/styles/styles';
import OnOffSetting from '../../Common/Onoff-setting/OnOffSetting';

interface Props {
  text: string;
  setting: string;
  icon: React.ReactNode;
}

const OnOff = ({ text, setting, icon }: Props): React.JSX.Element => (
  <View style={styles.item}>
    {icon}
    <Text style={styles.title}>{text}</Text>
    <OnOffSetting setting={setting} style={styles.switch} />
  </View>
);

export default OnOff;
