import React, { Component } from 'react';
import { View, Text, Switch } from 'react-native';
import {colors} from "../../../config/styles/colors";
import { styles } from './assets/styles/styles';

const switchProps = {
  onTintColor: colors.switchOnTintColor,
  tintColor: colors.switchOnTintColor,
  thumbTintColor: colors.switchThumbTintColor
};

export default OnOffSetting = props => {
  return <View style={styles.item}>
    <Text style={styles.title}>{props.text}</Text>
    <Switch
      style={styles.switch}
      onValueChange={(value) => props.update(value)}
      value={props.value}
      {...switchProps}
    />
  </View>
}