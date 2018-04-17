import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { styles } from './assets/styles/styles';
import OnOffSetting from '../../Common/Onoff-setting/OnOffSetting';

export default OnOff = props =>
  <View style={styles.item}>
    <Text style={styles.title}>{props.text}</Text>
    <OnOffSetting setting={props.setting} style={styles.switch} />
  </View>