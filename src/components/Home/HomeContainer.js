import React, { Component } from 'react';
import Orientation from "react-native-orientation";
import Home from './components/Home';

export class HomeContainer extends React.Component {
  constructor() {
    super();
  }

  componentDidMount() {
    Orientation.lockToPortrait();
  }

  navigate(value) {
    this.props.navigation.navigate(value);
  }

  render() {
    return (
      <Home navigate={(value) => this.navigate(value)} />
    )
  }
}