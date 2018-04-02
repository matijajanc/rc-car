import React, { Component } from 'react';
import { View, TextInput, Button, Image } from 'react-native';
import { styles } from './styles';
import ConnectionType from "./components/connection-type";
import WebSocketNodeJs from '../../utils/websocket';
import KeepAlive from '../../utils/keep-alive';
import Settings from '../../utils/settings';

export class ConnectScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      domain: null
    };
  }

  callbackDomain = (value) => {
    this.setState({
      domain: value
    });
  };

  connect = () => {
    if (this.state.domain) {
      const socket = WebSocketNodeJs.createSocket(this.state.domain);

      socket.onopen = () => {
        console.log("Connection Opened");
        //KeepAlive.start();
        Settings.send();
        //Settings.clearAll(); // just for testing
        this.props.navigation.navigate('Home');
      };

      socket.onerror = (e) => {
        console.log("Error");
      };
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Image style={styles.logo} source={require('./images/logo.png')} />
        <ConnectionType callback={this.callbackDomain}/>
        <Button style={styles.button} title="Connect" onPress={this.connect} />
      </View>
    );
  }
}
