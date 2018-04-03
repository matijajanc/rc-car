import React, { Component } from 'react';
import { View, Slider, AsyncStorage } from 'react-native';
import {styles} from "./styles";
import Transmitter from '../../utils/transmitter';

export class SpeedScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      sliderValue: 120
    };
    this.updateStates();
  }

  /**
   * Update state from saved value
   */
  updateStates() {
    AsyncStorage.getItem('setting-sp').then((value) => {
      if (value) {
        this.setState({sliderValue: parseInt(value)});
      }
    });
  }

  /**
   * Update RC car with new speed factor
   *
   * @param value
   */
  setSpeed = (value) => {
    this.setState({sliderValue: value});
    AsyncStorage.setItem('setting-sp', value.toString());
    Transmitter.send('sp'+value);
  };

  render() {
    return (
      <View style={styles.container}>
        <Slider minimumValue={95} maximumValue={165} value={this.state.sliderValue} step={1} onSlidingComplete={(value) => this.setSpeed(value)}/>
      </View>
    );
  }
}