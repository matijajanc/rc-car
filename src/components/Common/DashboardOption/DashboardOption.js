import React, { Component } from 'react';
import {TouchableHighlight} from 'react-native';
import Transmitter from '../../../utils/transmitter';

export default DashboardOption = Component => class extends React.Component {
  constructor(props) {
    super(props);
    this.defaultColor = '#fff';
    this.state = {
      command: false,
      color: this.defaultColor
    };
    this.updateOption = this.updateOption.bind(this);
  }

  updateOption() {
    const value = !this.state.command;
    this.setState({
      'command': value,
      'color': (value ? this.props.selectedColor : this.defaultColor)
    });
    Transmitter.send(this.props.command + (value ? 1 : 0));
  }

  render() {
    return (
      <TouchableHighlight onPress={this.updateOption}>
        <Component fillSvg={this.state.color} />
      </TouchableHighlight>
    )
  }
}