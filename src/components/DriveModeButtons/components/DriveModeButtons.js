import React, { Component } from 'react';
import {View, StatusBar} from 'react-native';
import styles from './assets/styles/styles';
import SpeedometerContainer from "../../Speedometer/SpeedometerContainer";
import BatteryLevelContainer from '../../BatteryLevel/BatteryLevelContainer';
import MotorTemperatureContainer from '../../MotorTemperature/MotorTemperatureContainer';
import DriveButton from './DriveButton/DriveButton';

export default DriveModeButton = props =>
  <View style={styles.container}>
    <StatusBar hidden/>
    <View style={styles.upDownBox}>
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dbw')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbx')}
        additionalStyles={styles.bottomSpace}
      />
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dbs')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbx')}
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
      />
      <DriveButton
        callbackBtnPress={() => props.callbackBtnPress('dbd')}
        callbackBtnRelease={() => props.callbackBtnRelease('dbg')}
      />
    </View>
  </View>