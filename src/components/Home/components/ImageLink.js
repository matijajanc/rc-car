import React, { Component } from 'react';
import { Image, TouchableHighlight } from 'react-native';
import { styles } from './assets/styles/styles';

export default ImageLink = props =>
  <TouchableHighlight style={styles.driveMode} onPress={() => props.navigate()}>
    <Image style={styles.touchImg} source={props.src}/>
  </TouchableHighlight>