import React, { Component } from 'react';
import {View, StatusBar} from 'react-native';
import styles from './assets/styles/styles';
import Speedometer from '../../Common/Speedometer/Speedometer';
import BatteryLevel from '../../Common/BatteryVoltage/BatteryVoltage';
import MotorTemperature from '../../Common/MotorTemperature/MotorTemperature';
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
      <Speedometer speed={props.speed} navigate={() => props.navigate('Speed')} />
      <View style={styles.carDataBox}>
        <BatteryLevel batteryVoltage={props.batteryVoltage} />
        <MotorTemperature motorTemperature={props.motorTemperature} />
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