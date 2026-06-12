import React from 'react';
import { View, TouchableHighlight } from 'react-native';
import { styles } from './assets/styles/styles';
import Link from './Link';
import OnOff from './OnOff';
import SpeedIcon from './icons/Speed-icon';
import SteerCalibrateIcon from './icons/SteerCalibrate-icon';
import ArduinoIcon from './icons/Arduino-icon';
import RangeSensorsIcon from './icons/RangeSensors-icon';
import BlinkersIcon from './icons/Blinkers-icon';
import TabletScreenIcon from './icons/TabletScreen-icon';

interface Props {
  navigate: (route: string) => void;
}

const Home = ({ navigate }: Props): React.JSX.Element => (
  <View style={styles.container}>
    <TouchableHighlight style={styles.driveMode} onPress={() => navigate('DriveWithButtons')}>
      <TabletScreenIcon width={128} height={128} />
    </TouchableHighlight>
    {/*<OnOff text={'Calibrate'} setting={'calibration'}/>*/}
    <Link
      text={'Speed'}
      navigate={() => navigate('Speed')}
      icon={<SpeedIcon bgColor={'#F7380D'} />}
    />
    {/*<Link text={'Steer Sensitivity'} navigate={() => navigate('')}/>*/}
    <Link
      text={'Steer Calibrate'}
      navigate={() => navigate('SteerCalibrate')}
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
      navigate={() => navigate('Arduino')}
      icon={<ArduinoIcon bgColor={'#AF4AD5'} />}
    />
  </View>
);

export default Home;
