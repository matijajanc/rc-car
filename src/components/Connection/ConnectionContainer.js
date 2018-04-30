import React, { Component } from 'react';
import { View } from 'react-native';
import WebSocketNodeJs from '../../utils/websocket';
import KeepAlive from '../../utils/keep-alive';
import Settings from '../../utils/settings';
import Vibrate from '../../utils/vibrate';
import Orientation from 'react-native-orientation';
import Connection from "./components/Connection";
import Config from 'react-native-config';
import ContainerComponent from '../Common/Container/ContainerComponent';
import Receiver from '../../utils/receiver';
const Container = ContainerComponent(View);

/**
 * For establishing connection with websocket server
 */
export default class ConnectionContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      domain: Config.WS_SERVER_IP,
      fallback: 0
    };
  }

  componentDidMount() {
    Orientation.lockToPortrait();
  }

  callbackDomain = (value) => {
    this.setState({
      domain: value
    });
  };

  /**
   * Connect to websocket server
   */
  connect = () => {
    if (this.state.domain) {
      const socket = WebSocketNodeJs.createSocket(this.state.domain);

      socket.onopen = () => {
        KeepAlive.start();
        Settings.send();
        Receiver.receive();
        //Settings.clearAll(); // for debugging
        this.props.navigation.navigate('Home');
      };

      socket.onerror = (e) => {
        console.log("Error");
      };

      Vibrate.vibrate();
      this.fallback();
    }
  };

  /**
   * Fallback so that we can open an App without NodeJs Server
   */
  fallback() {
    this.setState({fallback: this.state.fallback + 1});
    if (this.state.fallback >= 10) {
      this.props.navigation.navigate('Home');
    }
  }

  render() {
    return (
      <Container>
        <Connection callback={this.callbackDomain} connect={this.connect}/>
      </Container>
    );
  }
}
