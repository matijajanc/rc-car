import React, { Component } from 'react';
import { View } from 'react-native';
import { styles } from './assets/styles/styles';
import ImageLink from './ImageLink';
import SwitchComponent from './Switch';
import Link from './Link';
import OnOffSettingContainer from '../../Onoff-setting/OnOffSettingContainer';

export default Home = props => {
  console.log('Home Compo');
   return <View style={styles.container}>
        <ImageLink src={require('./assets/images/tablet-screen-128.png')}
          navigate={() => props.navigate('DriveWithButtons')}
        />
        <OnOffSettingContainer text={'Range Sensors'} setting={'calibration'} />
        <Link text={'Speed'} navigate={() => props.navigate('Speed')}/>
        <Link text={'Steer Sensitivity'} navigate={() => props.navigate('')}/>
        <Link text={'Steer Calibrate'} navigate={() => props.navigate('SteerCalibrate')}/>
        <OnOffSettingContainer text={'Range Sensors'} setting={'rs'} />
        <OnOffSettingContainer text={'Range Sensors'} setting={'bl'} />
        <Link text={'Arduino Uno R3'} navigate={() => props.navigate('Arduino')}/>
    </View>
}