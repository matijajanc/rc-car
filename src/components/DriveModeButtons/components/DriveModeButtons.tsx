import React from 'react';
import { View, StatusBar } from 'react-native';
import { DRIVE_STEER, DRIVE_THROTTLE } from '../../../../shared/protocol';
import type { SteerState, ThrottleState } from '../../../../shared/protocol';
import styles from './assets/styles/styles';
import SpeedometerContainer from '../../Speedometer/SpeedometerContainer';
import BatteryLevelContainer from '../../BatteryLevel/BatteryLevelContainer';
import MotorTemperatureContainer from '../../MotorTemperature/MotorTemperatureContainer';
import DriveButton from './DriveButton/DriveButton';
import ArrowIcon from './DriveButton/Arrow-icon';
import CarAlert from './CarAlert';

interface Props {
  /** Press reports the direction; release reports neutral/centre. */
  onThrottle: (throttle: ThrottleState) => void;
  onSteer: (steer: SteerState) => void;
  navigate: (route: string) => void;
}

/**
 * Look of the driving dashboard
 */
const DriveModeButton = ({ onThrottle, onSteer, navigate }: Props): React.JSX.Element => (
  <View style={styles.container}>
    <StatusBar hidden />
    <CarAlert />
    <View style={styles.upDownBox}>
      <DriveButton
        callbackBtnPress={() => onThrottle(DRIVE_THROTTLE.FORWARD)}
        callbackBtnRelease={() => onThrottle(DRIVE_THROTTLE.NEUTRAL)}
        additionalStyles={styles.bottomSpace}
        arrow={<ArrowIcon transform="translate(0 100) rotate(270)" />}
      />
      <DriveButton
        callbackBtnPress={() => onThrottle(DRIVE_THROTTLE.REVERSE)}
        callbackBtnRelease={() => onThrottle(DRIVE_THROTTLE.NEUTRAL)}
        arrow={<ArrowIcon transform="translate(100 0) rotate(90)" />}
      />
    </View>
    <View style={styles.mainBox}>
      <SpeedometerContainer navigate={() => navigate('Speed')} />
      <View style={styles.carDataBox}>
        <BatteryLevelContainer />
        <MotorTemperatureContainer />
      </View>
    </View>
    <View style={styles.leftRightBox}>
      <DriveButton
        callbackBtnPress={() => onSteer(DRIVE_STEER.LEFT)}
        callbackBtnRelease={() => onSteer(DRIVE_STEER.CENTER)}
        additionalStyles={styles.btnLeft}
        arrow={<ArrowIcon transform="translate(100 100) rotate(180)" />}
      />
      <DriveButton
        callbackBtnPress={() => onSteer(DRIVE_STEER.RIGHT)}
        callbackBtnRelease={() => onSteer(DRIVE_STEER.CENTER)}
        arrow={<ArrowIcon transform="translate(0 0) rotate(0)" />}
      />
    </View>
  </View>
);

export default DriveModeButton;
