import React, {Component} from 'react';
import {View, Image, TouchableHighlight} from 'react-native';
import {styles} from './assets/styles/styles';
import Link from './Link';
import OnOff from './OnOff';

export default Home = props =>
  <View style={styles.container}>
    <TouchableHighlight style={styles.driveMode} onPress={() => props.navigate('DriveWithButtons')}>
      <Image style={styles.touchImg} source={require('./assets/images/tablet-screen-128.png')}/>
    </TouchableHighlight>
    <OnOff text={'Calibrate'} setting={'calibration'}/>
    <Link text={'Speed'} navigate={() => props.navigate('Speed')}/>
    <Link text={'Speed'} navigate={() => props.navigate('Speed')}/>
    <Link text={'Steer Sensitivity'} navigate={() => props.navigate('')}/>
    <Link text={'Steer Calibrate'} navigate={() => props.navigate('SteerCalibrate')}/>
    <OnOff text={'Range Sensors'} setting={'rs'}/>
    <OnOff text={'Blinkers'} setting={'bl'}/>
    <Link text={'Arduino Uno R3'} navigate={() => props.navigate('Arduino')}/>
  </View>