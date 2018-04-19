import React, { Component } from 'react';
import { TouchableHighlight, Image } from 'react-native';
import styles from "../assets/styles/styles";

export default CalibrateButton = props =>
  <TouchableHighlight style={[styles.button]} onPress={() => props.callback()}>
    <Image style={styles.arrow} source={require('../assets/images/arrow.png')}/>
  </TouchableHighlight>