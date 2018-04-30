import React, { Component } from 'react';
import extractBrush from 'react-native-svg/lib/extract/extractBrush';
import { EventRegister } from 'react-native-event-listeners';
import BatteryLevel from './components/BatteryLevel';
import {colors} from "../../config/styles/colors";

export default class BatteryLevelContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      batteryVoltage: 0
    };
    this.unitsNum = 39;
    this.setBatteryLevelColors();
    this.fillColor = this.primaryColor;
    this.range = {
      start: 0,
      end: 0
    };
    this.batteryPercentage = this.batteryLevel(props.batteryVoltage);
    this.setSettings(this.batteryPercentage);
  };

  componentWillMount() {
    this.listener = EventRegister.addEventListener('wsReceive', (data) => {
      if (data.option === 'bv' && this.state.batteryVoltage !== data.value) {
        this.setState({
          batteryVoltage: data.value
        });
        this.batteryPercentage = this.batteryLevel(data.value);
        this.setSettings(this.batteryPercentage);
      }
    });
  }

  componentWillUnmount() {
    EventRegister.removeEventListener(this.listener);
  }

  setBatteryLevelColors() {
    this.primaryColor = '#fff';
    this.batteryLevelFullColor = colors.green;
    this.batteryLevelHalfFullColor = colors.orange;
    this.batteryLevelEmptyColor = colors.red;
  }

  /**
   * MAX (16,8V) => 675 => 3,3V
   * MIN (12,8V) => 435 => 2,13V
   * 1V => 60 units
   * 16mV => 1 unit
   *
   * @param voltage
   * @returns {number}
   */
  batteryLevel(voltage) {
    let batteryPercentage = 0;
    if (parseInt(voltage)) {
      batteryPercentage = (parseInt(voltage) - 435) / ((675 - 435) / 100);
    }

    return batteryPercentage;
  }

  setSettings(battery) {
    if (battery < 20) {
      this.fillColor = this.batteryLevelEmptyColor;
    } else if (battery >= 20 && battery < 60) {
      this.fillColor = this.batteryLevelHalfFullColor;
    } else {
      this.fillColor = this.batteryLevelFullColor;
    }
    this.range.end = this.calculateUnitsZone(battery);
  }

  calculateUnitsZone(battery) {
    return parseInt((this.unitsNum * parseInt(battery)) / 100);
  };

  fillSvg = (e) => {
    if (e) {
      const id = e.props.id;
      let childId = 0;
      if (id.includes('_')) {
        childId = parseInt(id.split('_')[1]);
      }

      if ((id >= this.range.start && id <= this.range.end)
        || ((childId >= this.range.start && childId <= this.range.end) && childId)
      ) {
        e.setNativeProps({fill: extractBrush(this.fillColor)});
      } else {
        e.setNativeProps({fill: extractBrush(this.primaryColor)});
      }
    }
  };

  render() {
    return <BatteryLevel fillSvg={(c) => this.fillSvg(c)} />
  }
}