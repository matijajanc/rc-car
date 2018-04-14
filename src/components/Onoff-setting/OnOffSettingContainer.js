import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import Transmitter from '../../utils/transmitter';
import OnOffSetting from './components/OnOffSetting';

export default class OnOffSettingContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      [this.props.setting]: false
    };
    this.updateState();
  }

  updateState() {
    const key = this.props.setting;
    AsyncStorage.getItem('setting-'+key).then((value) => {
      this.setState({[key]: (value === 'true')});
    })
  }

  setSetting = (value) => {
    const key = this.props.setting;
    this.setState({[key]: value});
    Transmitter.send(key+ (value ? 1 : 0));
    AsyncStorage.setItem('setting-'+key, value.toString());
  };


  render() {
    const {props} = this;
    return (
      <OnOffSetting
        text={'Range Sensors'}
        value={this.state[props.setting]}
        update={(value) => this.setSetting(value)}
      />
    )
  }
}