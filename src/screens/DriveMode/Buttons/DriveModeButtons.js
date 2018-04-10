import React, { Component } from 'react';
import { View, Text, TouchableWithoutFeedback, StatusBar } from 'react-native';
import Transmitter from '../../../utils/transmitter';
import WebSocketNodeJs from '../../../utils/websocket';
import Vibrate from '../../../utils/vibrate';
import { styles } from './styles';
import Orientation from 'react-native-orientation';
import Speedometer from '../components/speedometer/speedometer';
import BatteryLevel from "../components/battery/battery-level";
import MotorTemp from "../components/temperature/motor-temp";

export default class DriveModeButtonsScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      sp: 0,
      mt: 0,
      bv: 0,
      rs: null
    };
    this.receiver();
  }

  componentDidMount() {
    Orientation.lockToLandscape();
  }

  receiver() {
    const socket = WebSocketNodeJs.get();
    socket.onmessage = (data) => {
      const stopChar = /[^X]*/.exec(data.data)[0];
      const option = stopChar.substring(0, 2);
      const value = stopChar.substring(2);
      this.setState({[option]: parseInt(value)});   // SLOW !!! (How to update component faster)
      console.log("WS: "+ parseInt(value));
    };
  }

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
        <StatusBar hidden/>
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
          <Speedometer speed={this.state.sp}/>
          <BatteryLevel battery={this.state.bv}/>
          <MotorTemp temp={this.state.mt}/>
        </View>
        <View style={styles.leftRightBox}>
          <TouchableWithoutFeedback onPressIn={() => this.buttonPress('dba')} onPressOut={() => this.buttonRelease('dbg')}>
            <View style={[styles.button, styles.btnLeft]}>
              <Text style={styles.buttonArrow}>LEFT</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPressIn={() => this.buttonPress('dbd')} onPressOut={() => this.buttonRelease('dbg')}>
            <View style={[styles.button, styles.btnRight]}>
              <Text style={styles.buttonArrow}>RIGHT</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}