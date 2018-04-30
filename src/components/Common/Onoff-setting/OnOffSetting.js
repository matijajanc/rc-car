import React, { Component } from 'react';
import { Switch, AsyncStorage } from 'react-native';
import Transmitter from '../../../utils/transmitter';
import { colors } from "../../../config/styles/colors";

/**
 * Setting and sending updated settings to RC car
 */
export default class OnOffSetting extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      [this.props.setting]: false
    };
  }

  componentWillMount() {
    // Updates switch with saved settings
    const key = this.props.setting;
    AsyncStorage.getItem('setting-'+key).then((value) => {
      this.setState({[key]: (value === 'true')});
    })
  }

  defaultStyles() {
    return {
      onTintColor: colors.switchOnTintColor,
      tintColor: colors.switchOnTintColor,
      thumbTintColor: colors.switchThumbTintColor
    };
  }

  setSetting = (value) => {
    const key = this.props.setting;
    this.setState({[key]: value});
    Transmitter.send(key+ (value ? 1 : 0));
    AsyncStorage.setItem('setting-'+key, value.toString());
  };

  render() {
    const {state, props} = this;
    return (
      <Switch
        value={state[props.setting]}
        onValueChange={(value) => this.setSetting(value)}
        {...this.defaultStyles()}
        {...props}
      />
    )
  }
}
