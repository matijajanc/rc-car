import React, { Component } from 'react';
import { View, Text, Button, Image, TouchableHighlight, AsyncStorage } from 'react-native';
import {styles} from "./styles";
import Transmitter from '../../utils/transmitter';
import Vibrate from '../../utils/vibrate';

export class SteerCalibrateScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      angle: 0
    };
    this.updateStates();
  }

  updateStates() {
    AsyncStorage.getItem('setting-sc').then((value) => {
      if (value) {
        this.setState({angle: parseInt(value)});
      }
    });
  }

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
      <View style={styles.container}>
        <View style={styles.contentBox}>
          <TouchableHighlight style={[styles.button]} onPress={() => this.calibrate('decrement')}>
            <Image style={styles.arrow} source={require('./images/arrow.png')}/>
          </TouchableHighlight>
          <View style={styles.tyreBox}>
            <Image style={styles.tyre} source={require('./images/tyre.png')}/>
          </View>
          <TouchableHighlight style={styles.button} onPress={() => this.calibrate('increment')}>
            <Image style={[styles.arrow, styles.right]} source={require('./images/arrow.png')}/>
          </TouchableHighlight>
          </View>
        <View style={styles.angleBg}>
          <Text style={styles.angle}>{this.state.angle}</Text>
        </View>
      </View>
    );
  }
}