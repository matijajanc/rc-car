import React, { Component } from 'react';
import { View, AsyncStorage } from 'react-native';
import Transmitter from '../../utils/transmitter';
import Vibrate from '../../utils/vibrate';
import Orientation from 'react-native-orientation';
import SteerCalibrate from './components/SteerCalibrate';
import ContainerComponent from '../Common/Container/ContainerComponent';
const Container = ContainerComponent(View);

/**
 * Sometimes you wanna calibrate servo motor for
 * steering the car so that it goes
 * straight ahead.
 */
export default class SteerCalibrateContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      angle: 0
    };
  }

  /**
   * Update state from saved value
   */
  componentWillMount() {
    AsyncStorage.getItem('setting-sc').then((value) => {
      if (value) {
        this.setState({angle: parseInt(value)});
      }
    });
  }

  componentDidMount() {
    Orientation.lockToPortrait();
  }

  /**
   * Calibrate Steer on RC car
   *
   * @param value
   */
  calibrate = (value) => {
    if (((this.state.angle > -15) || (value !== 'decrement'))
      && ((this.state.angle < 15) || (value !== 'increment'))
    ) {
      const angle = this.state.angle + ((value === 'increment') ? +1 : -1);
      this.setState({angle});
      Transmitter.send('sc'+angle);
      AsyncStorage.setItem('setting-sc', angle.toString());
      Vibrate.vibrate();
    }
  };

  render() {
    return (
      <Container>
        <SteerCalibrate angle={this.state.angle} callback={this.calibrate} />
      </Container>
    );
  }
}