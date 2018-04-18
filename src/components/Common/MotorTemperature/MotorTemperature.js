import React, { Component } from 'react';
import { View, Text, Image } from 'react-native';
import {styles} from "./assets/styles/styles";

export default MotorTemperature = props =>
  <View style={styles.motorTempBox}>
    <Text>{props.motorTemperature}</Text>
    <Image style={styles.image} source={require('./assets/images/motor-temperature.png')} />
  </View>