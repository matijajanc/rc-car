import React, { Component } from 'react';
import { View, AsyncStorage } from 'react-native';
import Speed from './components/Speed';
import Transmitter from '../../utils/transmitter';
import ContainerComponent from '../Common/Container/ContainerComponent';
const Container = ContainerComponent(View);

export default class SpeedContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      sliderValue: 120
    };
  }

  /**
   * Update state from saved value
   */
  componentWillMount() {
    AsyncStorage.getItem('setting-sp').then((value) => {
      if (value) {
        this.setState({sliderValue: parseInt(value)});
      }
    });
  }

  defaultSettings() {
    return {
      minimumValue: 95,
      maximumValue: 165,
      step: 1
    }
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
      <Container>
        <Speed settings={this.defaultSettings()} value={this.state.sliderValue} callback={(value) => this.setSpeed(value)} />
      </Container>
    )
  }
}