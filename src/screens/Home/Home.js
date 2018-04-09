import React, { Component } from 'react';
import { View, Image, Text, Switch, TouchableHighlight, AsyncStorage } from 'react-native';
import { styles } from "../Home/styles";
import Transmitter from '../../utils/transmitter';
import Orientation from "react-native-orientation";

export class HomeScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      calibration: false,
      rs: false,
      bl: false
    };
    this.updateStates();
  }

  componentDidMount() {
    Orientation.lockToPortrait();
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

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <TouchableHighlight style={styles.driveMode} onPress={() => navigate('DriveWithButtons')}>
          <Image style={styles.touchImg} source={require('./images/tablet-screen-128.png')} />
        </TouchableHighlight>

        <View style={[styles.item, styles.firstItem]}>
          <Text style={styles.title}>Calibration</Text>
          <Switch style={styles.switch} onValueChange={this.calibrateAccelerometers} value={this.state.calibration} />
        </View>

        <TouchableHighlight style={styles.item} onPress={() => navigate('Speed')}>
          <Text style={styles.title}>Speed</Text>
        </TouchableHighlight>

        <View style={styles.item}>
          <Text style={styles.title}>Steer Sensitivity</Text>
        </View>

        <TouchableHighlight style={styles.item} onPress={() => navigate('SteerCalibrate')}>
          <Text style={styles.title}>Steer Calibrate</Text>
        </TouchableHighlight>

        <View style={styles.item}>
          <Text style={styles.title}>Range Sensors</Text>
          <Switch style={styles.switch} onValueChange={(value) => this.setSetting({rs: value})} value={this.state.rs} />
        </View>

        <View style={styles.item}>
          <Text style={styles.title}>Blinkers</Text>
          <Switch style={styles.switch} onValueChange={(value) => this.setSetting({bl: value})} value={this.state.bl} />
        </View>

        <TouchableHighlight style={[styles.item, styles.lastItem]} onPress={() => navigate('Arduino')}>
          <Text style={styles.title}>Arduino Uno R3</Text>
        </TouchableHighlight>
      </View>
    );
  }
}