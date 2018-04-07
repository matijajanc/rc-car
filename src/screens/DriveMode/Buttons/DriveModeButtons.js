import React, { Component } from 'react';
import { View, Image, Text, TouchableHighlight, TouchableWithoutFeedback } from 'react-native';
import Transmitter from '../../../utils/transmitter';
import Vibrate from '../../../utils/vibrate';
import { styles } from './styles';

export default class DriveModeButtonsScreen extends React.Component {

  buttonPress = (command) => {
    Transmitter.send(command);
    Vibrate.vibrate();
  };

  buttonRelease = (command) => {
    Transmitter.send(command);
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.upDownBox}>
          <TouchableWithoutFeedback onPressIn={() => this.buttonPress('dbw')} onPressOut={() => this.buttonRelease('dbx')}>
            <View style={[styles.button, styles.bottomSpace]}>
             <Text style={styles.buttonArrow}>UP</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={() => this.buttonPress('dbs')} onPressOut={() => this.buttonRelease('dbx')}>
            <View style={styles.button}>
              <Text style={styles.buttonArrow}>DOWN</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.mainBox}>
          <Text style={styles.speed}>0</Text>
        </View>
        <View style={styles.leftRightBox}>
          <TouchableWithoutFeedback onPressIn={() => this.buttonPress('dba')} onPressOut={() => this.buttonRelease('dbg')}>
            <View style={[styles.button, styles.rightSpace]}>
              <Text style={styles.buttonArrow}>LEFT</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={() => this.buttonPress('dbd')} onPressOut={() => this.buttonRelease('dbg')}>
            <View style={styles.button}>
              <Text style={styles.buttonArrow}>RIGHT</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}