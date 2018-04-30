import React, { Component } from 'react';
import extractBrush from 'react-native-svg/lib/extract/extractBrush';
import { EventRegister } from 'react-native-event-listeners';
import MotorTemperature from './components/MotorTemperature';
import {colors} from "../../config/styles/colors";

/**
 * To present motor temperature of the RC car
 */
export default class MotorTemperatureContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      motorTemperature: 0
    };
    this.unitsNum = 39;
    this.setMotorTemperatureColors();
    this.fillColor = this.primaryColor;
    this.range = {
      start: 0,
      end: 0
    };
    this.setSettings(props.motorTemperature);
  }

  componentDidUpdate(nextProps) {
    if (this.props.motorTemperature !== nextProps.motorTemperature) {
      this.setSettings(nextProps.motorTemperature);
    }
  }

  componentWillMount() {
    // Registering to websocket event listener for receiving car data
    this.listener = EventRegister.addEventListener('wsReceive', (data) => {
      if (data.option === 'mt' && this.state.motorTemperature !== data.value) {
        this.setState({
          motorTemperature: data.value
        });
        this.setSettings(data.value);
      }
    });
  }

  componentWillUnmount() {
    // Remove websocket event listener
    EventRegister.removeEventListener(this.listener);
  }

  /**
   * Setting default colors
   */
  setMotorTemperatureColors() {
    this.primaryColor = '#fff';
    this.temperatureHighColor = colors.red;
    this.temperatureMediumColor = colors.orange;
    this.temperatureLowColor = colors.green;
  }

  /**
   * Setting motor temperature color chart
   *
   * @param temperature
   */
  setSettings(temperature) {
    if (temperature < 40) {
      this.fillColor = this.temperatureLowColor;
    } else if (temperature >= 40 && temperature < 80) {
      this.fillColor = this.temperatureMediumColor;
    } else {
      this.fillColor = this.temperatureHighColor;
    }
    this.range.end = this.calculateUnitsZone(temperature);
  }

  /**
   * Calculate the end range to where to mark with color
   *
   * @param temperature
   * @returns {Number}
   */
  calculateUnitsZone(temperature) {
    return parseInt((this.unitsNum * parseInt(temperature)) / 100);
  };

  /**
   * Fills svg parts with appropriate color.
   * Manipulates directly with DOM elements.
   *
   * @param e
   */
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
    return <MotorTemperature fillSvg={(c) => this.fillSvg(c)} />
  }
}