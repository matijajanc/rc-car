import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './assets/styles/styles';
import ScreenHeader from '../../Common/ScreenHeader/ScreenHeader';
import CalibrateButton from './CalibrateButton/CalibrateButton';

interface Props {
  angle: number;
  callback: (direction: 'increment' | 'decrement') => void;
}

const SteerCalibrate = ({ angle, callback }: Props): React.JSX.Element => (
  <View style={styles.container}>
    <ScreenHeader title="Steer Calibrate" />

    <View style={styles.body}>
      <View style={styles.card}>
        <View style={styles.tyreBox}>
          <Image style={styles.tyre} source={require('./assets/images/tyre.png')} />
        </View>

        <View style={styles.stepper}>
          <CalibrateButton direction="left" callback={() => callback('decrement')} />
          <View style={styles.angleBox}>
            <Text style={styles.angle}>{angle}°</Text>
            <Text style={styles.angleLabel}>TRIM</Text>
          </View>
          <CalibrateButton direction="right" callback={() => callback('increment')} />
        </View>
      </View>

      <Text style={styles.hint}>
        Nudge the wheels left or right until the car tracks straight. Range ±15°.
      </Text>
    </View>
  </View>
);

export default SteerCalibrate;
