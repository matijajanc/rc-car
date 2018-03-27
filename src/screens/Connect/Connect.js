import React, { Component } from 'react';
import { AppRegistry, Text, View, TextInput, Button, Image } from 'react-native';
import { styles } from './styles';

export class ConnectScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      switched: false,
      ip: '192.168.4.1'
    }
  }

  connect = () => {
    if (this.state.ip.length) {
      this.props.navigation.navigate('Home')
    }
  };

  render() {
    //const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Image style={styles.logo} source={require('../../../images/logo.png')} />
        <TextInput style={styles.textInput} value={this.state.ip} onChangeText={(ip) => this.setState({ip})} />
        <Button style={styles.button} title="Connect" onPress={this.connect} />
      </View>
    );
  }
}

AppRegistry.registerComponent('ConnectScreen', () => ConnectScreen);