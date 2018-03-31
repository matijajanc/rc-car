import React, { Component } from 'react';
import { View, Button } from 'react-native';
import IP from './types/ip';

export default class ConnectionType extends React.Component {
  constructor(props) {
    super(props);
  }

  callback = (val) => {
    this.props.callback(val);
  };

  render() {
    return (
      <View>
        <IP callbackchild={this.callback}/>
      </View>
    )
  }
}