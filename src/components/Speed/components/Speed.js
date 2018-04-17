import React, { Component } from 'react';
import { View, Slider } from 'react-native';
import styles from './assets/styles/styles';

export default Speed = props =>
  <View style={styles.container}>
    <Slider {...props.settings} value={props.value} onSlidingComplete={(value) => props.callback(value)}/>
  </View>