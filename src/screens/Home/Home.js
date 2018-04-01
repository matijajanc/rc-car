import React, { Component } from 'react';
import { View, Text, Switch, TouchableHighlight } from 'react-native';
import { styles } from "../Home/styles";
import Transmitter from '../../utils/transmitter';

export class HomeScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      calibration: false,
      rangeSensors: false,
      blinkers: false
    }
  }

  calibrateAccelerometers = (value) => {
    this.setState = ({calibration: value});
  };

  setRangeSensors = (value) => {
    this.setState = ({rangeSensors: value});
    Transmitter.send('rs'+ (value ? 1 : 0));
  };

  setBlinkers = (value) => {
    this.setState = ({blinkers: value});
    Transmitter.send('bl'+ (value ? 1 : 0));
  };

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <View style={[styles.item, styles.firstItem]}>
          <Text style={styles.title}>Calibration</Text>
          <Switch style={styles.switch} onValueChange={this.calibrateAccelerometers} value={this.state.calibration} />
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Speed</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Speed</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Steer Sensitivity</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Steer Calibrate</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Range Sensors</Text>
          <Switch style={styles.switch} onValueChange={this.setRangeSensors} value={this.state.rangeSensors} />
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Blinkers</Text>
          <Switch style={styles.switch} onValueChange={this.setBlinkers} value={this.state.blinkers} />
        </View>

        <TouchableHighlight style={[styles.item, styles.lastItem]} onPress={() => navigate('Arduino')}>
          <Text style={styles.title}>Arduino Uno R3</Text>
        </TouchableHighlight >
      </View>
    );
  }
}