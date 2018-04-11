import React, { Component } from 'react';
import {View, Text, Image, Dimensions} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { styles } from './styles';

export default class Speedometer extends React.Component {
  constructor(props) {
    super(props);
    this.speedFactor = 2.2;   // max speed 45km/h
  }

  render() {
    return (
      <View style={styles.speedometerBox}>
        <AnimatedCircularProgress
          style={styles.speedLine}
          size={310}
          width={4}
          fill={(this.props.speed * this.speedFactor)}
          tintColor="#00e0ff"
          rotation={225}
          arcSweepAngle={270}
          prefill={100}
          backgroundColor="#0f161c">
        </AnimatedCircularProgress>
        <Image style={styles.speedometer} source={require('./images/speedometer.png')} />
        <Text style={styles.speed}>{this.props.speed}</Text>
      </View>
    )
  }
}