import React, { Component } from 'react';
import { TextInput } from 'react-native';
import {styles} from "./assets/styles/styles";

export default Ip = props =>
  <TextInput style={styles.textInput} value={props.domain} onChangeText={(value) => props.callback(value)} />