import React, { Component } from 'react';
import { TextInput } from 'react-native';
import {styles} from "../../styles";

export default class IP extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      domain: '192.168.4.1'
    };
    this.props.callbackchild(this.state.domain);
  }

  callback = (value) => {
    this.setState({
      domain: value
    });
    this.props.callbackchild(value);
  };

  render() {
    return <TextInput style={styles.textInput} value={this.state.domain} onChangeText={this.callback} />
  }
}