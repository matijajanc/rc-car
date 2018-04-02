import React, { Component } from 'react';
import { Vibration } from 'react-native';

export default class Vibrate extends React.Component {
  static vibrate(time = 0) {
    Vibration.vibrate(time > 0 ? time : 20);
  }
}
