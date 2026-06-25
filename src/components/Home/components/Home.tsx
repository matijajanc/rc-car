import React from 'react';
import { ScrollView, View, Text, TouchableHighlight } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './assets/styles/styles';
import { colors } from '../../../config/styles/colors';
import Link from './Link';
import OnOff from './OnOff';
import ChevronIcon from './icons/Chevron-icon';
import SpeedIcon from './icons/Speed-icon';
import SteerCalibrateIcon from './icons/SteerCalibrate-icon';
import ArduinoIcon from './icons/Arduino-icon';
import RangeSensorsIcon from './icons/RangeSensors-icon';
import BlinkersIcon from './icons/Blinkers-icon';
import TabletScreenIcon from './icons/TabletScreen-icon';

interface Props {
  navigate: (route: string) => void;
}

const Home = ({ navigate }: Props): React.JSX.Element => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 28 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.overline}>GARAGE</Text>
        <Text style={styles.title}>RC Car</Text>
      </View>

      <TouchableHighlight
        style={styles.hero}
        underlayColor={colors.surfacePressed}
        onPress={() => navigate('DriveWithButtons')}>
        <View style={styles.heroInner}>
          <View style={styles.heroIcon}>
            <TabletScreenIcon width={30} height={30} fill={colors.onAccent} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Drive</Text>
            <Text style={styles.heroSub}>Live control · landscape</Text>
          </View>
          <ChevronIcon size={22} color={colors.accent} />
        </View>
      </TouchableHighlight>

      <Text style={styles.sectionLabel}>CONTROLS</Text>
      <View style={styles.card}>
        <Link
          text={'Speed'}
          navigate={() => navigate('Speed')}
          icon={<SpeedIcon bgColor={colors.catSpeed} />}
        />
        <Link
          text={'Steer Calibrate'}
          navigate={() => navigate('SteerCalibrate')}
          icon={<SteerCalibrateIcon bgColor={colors.catSteer} />}
          divider
        />
        <Link
          text={'Range Calibrate'}
          navigate={() => navigate('RangeCalibrate')}
          icon={<RangeSensorsIcon bgColor={colors.catSensors} />}
          divider
        />
        <OnOff
          text={'Range Sensors'}
          setting={'rs'}
          icon={<RangeSensorsIcon bgColor={colors.catSensors} />}
          divider
        />
        <OnOff
          text={'Blinkers'}
          setting={'bl'}
          icon={<BlinkersIcon bgColor={colors.catBlinkers} />}
          divider
        />
        <Link
          text={'Arduino Uno R3'}
          navigate={() => navigate('Arduino')}
          icon={<ArduinoIcon bgColor={colors.catArduino} />}
          divider
        />
      </View>
    </ScrollView>
  );
};

export default Home;
