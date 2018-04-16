import React, { Component } from 'react';
import sectionListData from './data/sectionListData';
import Arduino from './components/Arduino';

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

  render() {
    return (
      <Arduino data={this.state.data} />
    )
  }
}