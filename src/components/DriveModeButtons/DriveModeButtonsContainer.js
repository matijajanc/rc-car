import React, { Component } from 'react';
import { View } from 'react-native';
import Transmitter from '../../utils/transmitter';
import WebSocketNodeJs from '../../utils/websocket';
import Vibrate from '../../utils/vibrate';
import Orientation from 'react-native-orientation';
import DriveModeButtons from './components/DriveModeButtons';
import ContainerComponent from '../Common/Container/ContainerComponent';
const Container = ContainerComponent(View);

export default class DriveModeButtonsContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      sp: 0,
      mt: 0,
      bv: 0,
      rs: null
    };
    this.navigate = this.navigate.bind(this);
  }

  componentDidMount() {
    Orientation.lockToLandscape();
    this.receiver();
  }

  receiver() {
    const socket = WebSocketNodeJs.get();
    socket.onmessage = (data) => {
      const stopChar = /[^X]*/.exec(data.data)[0];
      const option = stopChar.substring(0, 2);
      const value = stopChar.substring(2);
      this.setState({[option]: parseInt(value)});
    };
  }

  buttonPress = (command) => {
    Transmitter.send(command);
    Vibrate.vibrate();
  };

  buttonRelease = (command) => {
    Transmitter.send(command);
  };

  navigate(value) {
    this.props.navigation.navigate(value);
  }

  render() {
    const {state} = this;
    return (
      <Container>
        <DriveModeButtons
          speed={state.sp}
          motorTemperature={state.mt}
          batteryVoltage={state.bv}
          rangeSensors={state.rs}
          callbackBtnPress={this.buttonPress}
          callbackBtnRelease={this.buttonRelease}
          navigate={this.navigate}
        />
      </Container>
    )
  }
}