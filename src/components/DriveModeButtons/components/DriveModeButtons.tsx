import React from 'react';
import { View, StatusBar } from 'react-native';
import styles from './assets/styles/styles';
import SpeedometerContainer from '../../Speedometer/SpeedometerContainer';
import BatteryLevelContainer from '../../BatteryLevel/BatteryLevelContainer';
import MotorTemperatureContainer from '../../MotorTemperature/MotorTemperatureContainer';
import DriveButton from './DriveButton/DriveButton';
import ArrowIcon from './DriveButton/Arrow-icon';

interface Props {
  callbackBtnPress: (command: string) => void;
  callbackBtnRelease: (command: string) => void;
  navigate: (route: string) => void;
}

/**
 * Look of the driving dashboard
 */
const DriveModeButton = ({
  callbackBtnPress,
  callbackBtnRelease,
  navigate,
}: Props): React.JSX.Element => (
  <View style={styles.container}>
    <StatusBar hidden />
    <View style={styles.upDownBox}>
      <DriveButton
        callbackBtnPress={() => callbackBtnPress('dbw')}
        callbackBtnRelease={() => callbackBtnRelease('dbx')}
        additionalStyles={styles.bottomSpace}
        arrow={<ArrowIcon transform="translate(0 100) rotate(270)" />}
      />
      <DriveButton
        callbackBtnPress={() => callbackBtnPress('dbs')}
        callbackBtnRelease={() => callbackBtnRelease('dbx')}
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
        callbackBtnPress={() => callbackBtnPress('dba')}
        callbackBtnRelease={() => callbackBtnRelease('dbg')}
        additionalStyles={styles.btnLeft}
        arrow={<ArrowIcon transform="translate(100 100) rotate(180)" />}
      />
      <DriveButton
        callbackBtnPress={() => callbackBtnPress('dbd')}
        callbackBtnRelease={() => callbackBtnRelease('dbg')}
        arrow={<ArrowIcon transform="translate(0 0) rotate(0)" />}
      />
    </View>
  </View>
);

export default DriveModeButton;
