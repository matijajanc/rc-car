import React, { Component } from 'react';
import { View, Text, Image } from 'react-native';
import styles from "./assets/styles/styles";

export default BatteryLevel = props =>
  <View style={styles.batteryLevelBox}>
    <Text>{props.batteryVoltage}</Text>
    <Image style={styles.image} source={require('./assets/images/battery-level.png')} />
  </View>