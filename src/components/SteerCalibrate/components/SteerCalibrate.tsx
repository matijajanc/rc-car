import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './assets/styles/styles';
import CalibrateButton from './CalibrateButton/CalibrateButton';

interface Props {
  angle: number;
  callback: (direction: 'increment' | 'decrement') => void;
}

const SteerCalibrate = ({ angle, callback }: Props): React.JSX.Element => (
  <View style={styles.container}>
    <View style={styles.contentBox}>
      <CalibrateButton callback={() => callback('decrement')} />
      <View style={styles.tyreBox}>
        <Image style={styles.tyre} source={require('./assets/images/tyre.png')} />
      </View>
      <CalibrateButton callback={() => callback('increment')} />
    </View>
    <View style={styles.angleBg}>
      <Text style={styles.angle}>{angle}</Text>
    </View>
  </View>
);

export default SteerCalibrate;
