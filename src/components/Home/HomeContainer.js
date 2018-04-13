import React, { Component } from 'react';
import { View, AsyncStorage } from 'react-native';
import Transmitter from '../../utils/transmitter';
import Orientation from "react-native-orientation";
import {styles} from './components/assets/styles/styles';
import SwitchComponent from './components/Switch';
import Link from './components/Link';
import ImageLink from './components/ImageLink';

export class HomeContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      calibration: false,
      rs: false,
      bl: false
    };
    this.updateStates();
  }

  updateStates() {
    AsyncStorage.getAllKeys().then((keys) => {
      const settings = keys.filter((key) => key.startsWith('setting-'));
      for (let item of settings) {
        AsyncStorage.getItem(item).then((value) => {
          const setting = item.replace('setting-', '');
          this.setState({[setting]: (value === 'true')});
        });
      }
    });
  }

  componentDidMount() {
    Orientation.lockToPortrait();
  }

  calibrateAccelerometers = (value) => {
    this.setState({calibration: value});
  };

  setSetting = (newSate) => {
    const key = Object.keys(newSate)[0];
    const value = Object.values(newSate)[0];
    this.setState(newSate);
    Transmitter.send(key+ (value ? 1 : 0));
    AsyncStorage.setItem('setting-'+key, value.toString());
  };

  navigate(value) {
    this.props.navigation.navigate(value);
  }

  render() {
    return (
      <View style={styles.container}>
        <ImageLink src={require('./components/assets/images/tablet-screen-128.png')} navigate={() => this.navigate('DriveWithButtons')} />
        <SwitchComponent text={'Calibration'} value={this.state.calibration} update={(value) => this.calibrateAccelerometers({calibration: value})} />
        <Link text={'Speed'} navigate={() => this.navigate('Speed')} />
        <Link text={'Steer Sensitivity'} navigate={() => this.navigate('')} />
        <Link text={'Steer Calibrate'} navigate={() => this.navigate('SteerCalibrate')} />
        <SwitchComponent text={'Range Sensors'} value={this.state.rs} update={(value) => this.setSetting({rs: value})} />
        <SwitchComponent text={'Blinkers'} value={this.state.bl} update={(value) => this.setSetting({bl: value})} />
        <Link text={'Arduino Uno R3'} navigate={() => this.navigate('Arduino')} />
      </View>
    )
  }
}