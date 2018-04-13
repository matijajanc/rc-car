import React, { Component } from 'react';
import { Text, TouchableHighlight } from 'react-native';
import { styles } from './assets/styles/styles';

export default Link = props =>
  <TouchableHighlight style={styles.item} onPress={() => props.navigate()}>
    <Text style={styles.title}>{props.text}</Text>
  </TouchableHighlight>