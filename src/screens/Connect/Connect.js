import React, { Component } from 'react';
import { View, TextInput, Button, Image } from 'react-native';
import { styles } from './styles';
import ConnectionType from "./components/connection-type";

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
    console.log(this.state.domain);
    // if (this.state.ip.length) {
    //   //this.props.navigation.navigate('Home')
    // }
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
