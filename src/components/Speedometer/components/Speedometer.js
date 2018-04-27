import React, { Component } from 'react';
import {View, Image, Text, TouchableHighlight} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import styles from './assets/styles/styles';

const speedFactor = 2.2; // max speed 45km/h
const circularSettings = {
  style: styles.speedLine,
  size: 310,
  width: 4,
  tintColor: '#00e0ff',
  rotation: 225,
  arcSweepAngle: 270,
  prefill: 100,
  backgroundColor: '#0f161c'
};

export default Speedometer = props =>
  <View style={styles.speedometerBox}>
    <AnimatedCircularProgress {...circularSettings} fill={(props.speed * speedFactor)}>
    </AnimatedCircularProgress>
    <Image style={styles.speedometer} source={require('./assets/images/speedometer.png')}/>
    <TouchableHighlight style={styles.speedBox} onPress={props.navigate}>
      <Text style={styles.speed}>{props.speed}</Text>
    </TouchableHighlight>
  </View>