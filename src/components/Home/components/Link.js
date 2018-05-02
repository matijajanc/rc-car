import React, { Component } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { styles } from './assets/styles/styles';

export default Link = props =>
  <TouchableHighlight style={styles.item} onPress={() => props.navigate()}>
    <View style={styles.itemBox}>
      {props.icon}
      <Text style={styles.title}>{props.text}</Text>
    </View>
  </TouchableHighlight>