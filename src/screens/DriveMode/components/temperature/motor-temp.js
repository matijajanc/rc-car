import React, { Component } from 'react';
import { View, Text, Image } from 'react-native';
import {styles} from "./styles";

export default class MotorTemp extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.motorTempBox}>
        <Text>{this.props.mt}</Text>
        <Image style={styles.image} source={require('./images/motor-temperature.png')} />
      </View>
    );
  }
}