import React, { Component } from 'react';
import {View, StatusBar} from 'react-native';
import styles from './assets/styles/styles';
import SpeedometerContainer from "../../Speedometer/SpeedometerContainer";
import BatteryLevelContainer from '../../BatteryLevel/BatteryLevelContainer';
import MotorTemperatureContainer from '../../MotorTemperature/MotorTemperatureContainer';
import DriveButton from './DriveButton/DriveButton';
import ArrowIcon from './DriveButton/Arrow-icon';

/**
 * Look of the driving dashboard
 */
export default DriveModeButton = props =>
  <View style={styles.container}>
    <StatusBar hidden/>
    <View style={styles.upDownBox}>
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dbw')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbx')}
        additionalStyles={styles.bottomSpace}
        arrow={<ArrowIcon transform="translate(0 100) rotate(270)" />}
      />
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dbs')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbx')}
        arrow={<ArrowIcon transform="translate(100 0) rotate(90)" />}
      />
    </View>
    <View style={styles.mainBox}>
      <SpeedometerContainer navigate={() => props.navigate('Speed')} />
      <View style={styles.carDataBox}>
        <BatteryLevelContainer />
        <MotorTemperatureContainer />
      </View>
    </View>
    <View style={styles.leftRightBox}>
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dba')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbg')}
        additionalStyles={styles.btnLeft}
        arrow={<ArrowIcon transform="translate(100 100) rotate(180)" />}
      />
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dbd')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbg')}
        arrow={<ArrowIcon transform="translate(0 0) rotate(0)" />}
      />
    </View>
  </View>