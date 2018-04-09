import React, { Component } from 'react';
import { Text, Image } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { styles } from './styles';

export default class Speedometer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <AnimatedCircularProgress
        style={styles.speedLine}
        size={310}
        width={4}
        fill={this.props.speed}
        tintColor="#00e0ff"
        rotation={225}
        arcSweepAngle={270}
        prefill={75}
        backgroundColor="#0f161c">
      </AnimatedCircularProgress>
    )
  }
}