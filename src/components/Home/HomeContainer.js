import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import Transmitter from '../../utils/transmitter';
import Orientation from "react-native-orientation";
import Home from './components/Home';

export class HomeContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      calibration: false,
      rs: false,
      bl: false
    };
    //this.updateStates();
  }

  componentDidMount() {
    Orientation.lockToPortrait();
  }

  updateStates() {
    AsyncStorage.getAllKeys().then((keys) => {
      let settingsObj = {};
      let promise = [];
      const settings = keys.filter((key) => key.startsWith('setting-'));
      for (let item of settings) {
        promise.push(AsyncStorage.getItem(item).then((value) => {
          const setting = item.replace('setting-', '');
          Object.assign(settingsObj, {[setting]: (value === 'true')});
        }));
      }
      Promise.all(promise).then(() => {
        this.setState(settingsObj);
      });
    });
  }

  calibrateAccelerometers = (value) => {
    this.setState(value);
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
      <Home
        {...this.state}
        navigate={(value) => this.navigate(value)}
        calibrate={(value) => this.calibrateAccelerometers(value)}
        setting={(value) => this.setSetting(value)}
      />
    )
  }
}