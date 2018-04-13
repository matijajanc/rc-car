import React, { Component } from 'react';
import WebSocketNodeJs from '../../utils/websocket';
import KeepAlive from '../../utils/keep-alive';
import Settings from '../../utils/settings';
import Vibrate from '../../utils/vibrate';
import Orientation from 'react-native-orientation';
import Connection from "./components/Connection";

export class ConnectionContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      domain: null,
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

  connect = () => {
    if (this.state.domain) {
      const socket = WebSocketNodeJs.createSocket(this.state.domain);

      socket.onopen = () => {
        KeepAlive.start();
        Settings.send();
        //Settings.clearAll(); // just for testing
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
      <Connection domain={this.callbackDomain} connect={this.connect}/>
    );
  }
}
