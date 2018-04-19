import React, { Component } from 'react';
import { View, Text, Image } from 'react-native';
import styles from './assets/styles/styles';
import CalibrateButton from './CalibrateButton/CalibrateButton';

export default SteerCalibrate = props =>
  <View style={styles.container}>
    <View style={styles.contentBox}>
      <CalibrateButton callback={() => props.callback('decrement')} />
      <View style={styles.tyreBox}>
        <Image style={styles.tyre} source={require('./assets/images/tyre.png')}/>
      </View>
      <CalibrateButton callback={() => props.callback('increment')} />
    </View>
    <View style={styles.angleBg}>
      <Text style={styles.angle}>{props.angle}</Text>
    </View>
  </View>