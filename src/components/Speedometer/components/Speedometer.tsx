import React from 'react';
import { View, Image, Text, TouchableHighlight } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import styles from './assets/styles/styles';
import { colors } from '../../../config/styles/colors';
import Lights from '../../Common/DashboardOption/components/Lights/Lights';
import Blinkers from '../../Common/DashboardOption/components/Blinkers/Blinkers';
import LongLights from '../../Common/DashboardOption/components/Long-lights/Long-lights';

interface Props {
  speed: number;
  navigate: (route: string) => void;
}

const speedFactor = 2.2; // max speed 45km/h
const circularSettings = {
  style: styles.speedLine,
  size: 310,
  width: 4,
  tintColor: colors.lightBlue,
  rotation: 225,
  arcSweepAngle: 270,
  prefill: 100,
  backgroundColor: '#000',
};

const Speedometer = ({ speed, navigate }: Props): React.JSX.Element => (
  <View style={styles.speedometerBox}>
    <AnimatedCircularProgress {...circularSettings} fill={speed * speedFactor} />
    <Image style={styles.speedometer} source={require('./assets/images/speedometer.png')} />
    <TouchableHighlight style={styles.speedBox} onPress={() => navigate('Speed')}>
      <Text style={styles.speed}>{speed}</Text>
    </TouchableHighlight>
    <View style={styles.controlsBox}>
      <Lights command={'cl'} selectedColor={colors.green} />
      <Blinkers command={'b4'} selectedColor={colors.orange} />
      <LongLights command={'ll'} selectedColor={colors.blue} />
    </View>
  </View>
);

export default Speedometer;
