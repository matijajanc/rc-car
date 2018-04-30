import React, { Component } from 'react';
import { View } from 'react-native';
import Orientation from "react-native-orientation";
import Home from './components/Home';
import ContainerComponent from '../Common/Container/ContainerComponent';
const Container = ContainerComponent(View);

/**
 * From here you can enable/disable all of the car settable options
 */
export default class HomeContainer extends React.Component {
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
      <Container>
        <Home navigate={(value) => this.navigate(value)} />
      </Container>
    )
  }
}