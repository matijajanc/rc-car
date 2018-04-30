import React, { Component } from 'react';
import { Vibration } from 'react-native';

/**
 * Just an abstraction for vibrate functionality
 */
export default class Vibrate extends React.Component {
  static vibrate(time = 0) {
    Vibration.vibrate(time > 0 ? time : 20);
  }
}
