import React, { Component } from 'react';
import { TextInput } from 'react-native';
import {styles} from "./assets/styles/styles";
import Config from 'react-native-config';

export default Ip = props =>
  <TextInput style={styles.textInput} value={Config.WS_SERVER_IP} onChangeText={props.callback} />