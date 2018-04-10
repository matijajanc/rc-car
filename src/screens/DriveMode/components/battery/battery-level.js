import React, { Component } from 'react';
import { View, Text, Image } from 'react-native';
import {styles} from "./styles";

export default class BatteryLevel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.batteryLevelBox}>
        <Text>{this.props.bv}</Text>
        <Image style={styles.image} source={require('./images/battery-level.png')} />
      </View>
    );
  }
}