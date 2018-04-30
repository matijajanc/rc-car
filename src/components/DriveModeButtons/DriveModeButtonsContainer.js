import React, { Component } from 'react';
import { View } from 'react-native';
import Transmitter from '../../utils/transmitter';
import Vibrate from '../../utils/vibrate';
import Orientation from 'react-native-orientation';
import DriveModeButtons from './components/DriveModeButtons';
import ContainerComponent from '../Common/Container/ContainerComponent';
const Container = ContainerComponent(View);

/**
 * Main driving mode is driving with buttons.
 * Here you have buttons for forward/backward and
 * left/right, plus speedometer
 */
export default class DriveModeButtonsContainer extends React.Component {
  constructor() {
    super();
    this.navigate = this.navigate.bind(this);
  }

  componentDidMount() {
    Orientation.lockToLandscape();
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
    return (
      <Container>
        <DriveModeButtons
          callbackBtnPress={this.buttonPress}
          callbackBtnRelease={this.buttonRelease}
          navigate={this.navigate}
        />
      </Container>
    )
  }
}