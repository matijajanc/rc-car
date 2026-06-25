import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import styles from './assets/styles/styles';
import { colors } from '../../../config/styles/theme';
import ScreenHeader from '../../Common/ScreenHeader/ScreenHeader';
// Shared stepper atom — the same +/- control SteerCalibrate uses. It carries
// its own styling, so reusing it here keeps the two calibration screens
// visually identical without duplicating the button.
import CalibrateButton from '../../SteerCalibrate/components/CalibrateButton/CalibrateButton';

interface Props {
  angle: number;
  callback: (direction: 'increment' | 'decrement') => void;
}

const RangeCalibrate = ({ angle, callback }: Props): React.JSX.Element => (
  <View style={styles.container}>
    <ScreenHeader title="Range Calibrate" />

    <View style={styles.body}>
      <View style={styles.card}>
        <View style={styles.sensorBox}>
          {/* A simple "aim straight ahead" reticle: concentric rings with a
              pointer marking the sensor's centre direction. */}
          <Svg width={120} height={92} viewBox="0 0 120 92">
            <Circle cx={60} cy={50} r={38} stroke={colors.border} strokeWidth={1.5} fill="none" />
            <Circle cx={60} cy={50} r={25} stroke={colors.border} strokeWidth={1.5} fill="none" />
            <Circle
              cx={60}
              cy={50}
              r={12}
              stroke={colors.textMuted}
              strokeWidth={1.5}
              fill="none"
            />
            <Line
              x1={60}
              y1={50}
              x2={60}
              y2={8}
              stroke={colors.textPrimary}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Circle cx={60} cy={50} r={3.5} fill={colors.textPrimary} />
          </Svg>
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
        Centre the front distance-sensor servo so it sweeps straight ahead. Range ±15°.
      </Text>
    </View>
  </View>
);

export default RangeCalibrate;
