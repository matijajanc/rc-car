import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import Transmitter from '../../utils/transmitter';
import Vibrate from '../../utils/vibrate';
import SteerCalibrate from './components/SteerCalibrate';

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
      //Transmitter.send('sc'+angle);
      AsyncStorage.setItem('setting-sc', angle.toString());
      Vibrate.vibrate();
    }
  };

  render() {
    console.log("render");
    return (
      <SteerCalibrate {...this.state} callback={(value) => this.calibrate(value)} />
    );
  }
}