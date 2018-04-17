import React, { Component } from 'react';
import { View, Text, Image, TouchableHighlight } from 'react-native';
import styles from './assets/styles/styles';

export default SteerCalibrate = props =>
  <View style={styles.container}>
    <View style={styles.contentBox}>
      <TouchableHighlight style={[styles.button]} onPress={() => props.callback('decrement')}>
        <Image style={styles.arrow} source={require('./assets/images/arrow.png')}/>
      </TouchableHighlight>
      <View style={styles.tyreBox}>
        <Image style={styles.tyre} source={require('./assets/images/tyre.png')}/>
      </View>
      <TouchableHighlight style={styles.button} onPress={() => props.callback('increment')}>
        <Image style={[styles.arrow, styles.right]} source={require('./assets/images/arrow.png')}/>
      </TouchableHighlight>
    </View>
    <View style={styles.angleBg}>
      <Text style={styles.angle}>{props.angle}</Text>
    </View>
  </View>