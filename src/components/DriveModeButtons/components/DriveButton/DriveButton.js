import React, { Component } from 'react';
import {View, TouchableWithoutFeedback} from 'react-native';
import styles from '../assets/styles/styles';

export default DriveButton = props =>
  <TouchableWithoutFeedback
    onPressIn={() => props.callbackBtnPress()}
    onPressOut={() => props.callbackBtnRelease()}
  >
    <View style={[styles.button, props.additionalStyles]}>
      {props.arrow}
    </View>
  </TouchableWithoutFeedback>