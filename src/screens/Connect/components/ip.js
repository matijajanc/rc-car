import React, { Component } from 'react';
import { TextInput } from 'react-native';
import {styles} from "../styles";
import Config from 'react-native-config';

export default class IP extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      domain: Config.WS_SERVER_IP
    };
    this.props.callback(this.state.domain);
  }

  callback = (value) => {
    this.setState({
      domain: value
    });
    this.props.callback(value);
  };

  render() {
    return <TextInput style={styles.textInput} value={this.state.domain} onChangeText={this.callback} />
  }
}