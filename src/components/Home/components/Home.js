import React, {Component} from 'react';
import {View, Image, TouchableHighlight} from 'react-native';
import {styles} from './assets/styles/styles';
import Link from './Link';
import OnOff from './OnOff';
import SpeedIcon from './icons/Speed-icon';
import SteerCalibrateIcon from './icons/SteerCalibrate-icon';
import ArduinoIcon from './icons/Arduino-icon';
import RangeSensorsIcon from './icons/RangeSensors-icon';
import BlinkersIcon from './icons/Blinkers-icon';

export default Home = props =>
  <View style={styles.container}>
    <TouchableHighlight style={styles.driveMode} onPress={() => props.navigate('DriveWithButtons')}>
      <Image style={styles.touchImg} source={require('./assets/images/tablet-screen-128.png')}/>
    </TouchableHighlight>
    {/*<OnOff text={'Calibrate'} setting={'calibration'}/>*/}
    <Link
      text={'Speed'}
      navigate={() => props.navigate('Speed')}
      icon={<SpeedIcon bgColor={'#F7380D'} />}
    />
    {/*<Link text={'Steer Sensitivity'} navigate={() => props.navigate('')}/>*/}
    <Link
      text={'Steer Calibrate'}
      navigate={() => props.navigate('SteerCalibrate')}
      icon={<SteerCalibrateIcon bgColor={'#218BEC'} />}
    />
    <OnOff
      text={'Range Sensors'}
      setting={'rs'}
      icon={<RangeSensorsIcon bgColor={'#67952F'} />}
    />
    <OnOff
      text={'Blinkers'}
      setting={'bl'}
      icon={<BlinkersIcon bgColor={'#F3781E'} />}
    />
    <Link
      text={'Arduino Uno R3'}
      navigate={() => props.navigate('Arduino')}
      icon={<ArduinoIcon bgColor={'#AF4AD5'} />}
    />
  </View>