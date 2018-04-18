import React, { Component } from 'react';
import {View, Text, TouchableWithoutFeedback} from 'react-native';
import styles from '../assets/styles/styles';

export default DriveButton = props =>
  <TouchableWithoutFeedback
    onPressIn={() => props.callbackBtnPress()}
    onPressOut={() => props.callbackBtnRelease()}
  >
    <View style={[styles.button, props.additionalStyles]}>
      <Text style={styles.buttonArrow}>Arrow</Text>
    </View>
  </TouchableWithoutFeedback>