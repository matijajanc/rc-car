import React, { Component } from 'react';
import { View } from 'react-native';

export default class ContainerComponent extends React.Component {
  render() {
    return (
      <View style={{flex:1, backgroundColor:'red'}}>
        <ContainerComponent>
          {...this.props}
        </ContainerComponent>
      </View>
    );
  }
}