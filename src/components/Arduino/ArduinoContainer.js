import React, { Component } from 'react';
import Orientation from 'react-native-orientation';
import sectionListData from './data/sectionListData';
import Arduino from './components/Arduino';

/**
 * Displaying Arduino data
 */
export default class ArduinoContainer extends React.Component {
  constructor() {
    super();
    this.state = {
      data: null
    }
  }

  componentWillMount() {
    this.setState({data: sectionListData});
  }

  componentDidMount() {
    Orientation.lockToPortrait();
  }

  render() {
    return (
      <Arduino data={this.state.data} />
    )
  }
}