import React, { Component } from 'react';
import { View, Button, Image } from 'react-native';
import { styles } from './assets/styles/styles';
import IP from './Ip';

export default Connection = props =>
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./assets/images/logo.png')} />
      <IP ip={props.domain}/>
      <Button style={styles.button} title="Connect" onPress={props.connect} />
    </View>