import React, { Component } from 'react';
import { View } from 'react-native';
import { Routes } from './src/config/routes';
import { styles } from './src/config/styles/main';

//type Props = {};
//export default class App extends Component<Props> {
export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Routes/>
      </View>
    );
  }
}
