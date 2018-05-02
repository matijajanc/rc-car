import React, { Component } from 'react';
import { View, Button, Image, TouchableOpacity, Text } from 'react-native';
import { styles } from './assets/styles/styles';
import IP from './Ip';

export default Connection = props =>
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./assets/images/logo.png')} />
      <IP callback={props.callback}/>
      <TouchableOpacity style={styles.button} onPress={props.connect}>
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>