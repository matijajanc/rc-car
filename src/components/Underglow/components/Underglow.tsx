import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import styles from './assets/styles/styles';
import { colors } from '../../../config/styles/theme';
import ScreenHeader from '../../Common/ScreenHeader/ScreenHeader';
import { Channels, channelsToHex } from '../../../utils/underglow';

interface Props {
  /** Current slider position, 0..1. */
  position: number;
  /** Channel values derived from {@link position}; used for the live preview. */
  channels: Channels;
  onChange: (position: number) => void;
  onComplete: (position: number) => void;
}

const Underglow = ({ position, channels, onChange, onComplete }: Props): React.JSX.Element => {
  const hex = channelsToHex(channels);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Underglow" />

      <View style={styles.body}>
        <View style={styles.card}>
          {/* Live preview of the colour the strip will show (glows in-colour). */}
          <View style={[styles.swatch, { backgroundColor: hex, shadowColor: hex }]} />
          <Text style={styles.hex}>{hex}</Text>
          <Text style={styles.channels}>
            R {channels.r} · G 0 · B {channels.b}
          </Text>

          {/* The reachable spectrum: blue → magenta → deep pink. These three
              stops are the exact endpoints of the hue arc in underglow.ts. */}
          <View style={styles.spectrum}>
            <Svg width="100%" height={14}>
              <Defs>
                <LinearGradient id="underglowArc" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#0000FF" />
                  <Stop offset="0.571" stopColor="#FF00FF" />
                  <Stop offset="1" stopColor="#FF0040" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="14" rx="7" fill="url(#underglowArc)" />
            </Svg>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={position}
            onValueChange={onChange}
            onSlidingComplete={onComplete}
            minimumTrackTintColor={colors.borderStrong}
            maximumTrackTintColor={colors.borderStrong}
            thumbTintColor={colors.textPrimary}
          />
        </View>

        <Text style={styles.hint}>
          Colour of the LED strip under the car. The strip has only red and blue
          channels, so the range runs blue → magenta → pink. Red is reserved as
          the stop / brake signal and can't be picked.
        </Text>
      </View>
    </View>
  );
};

export default Underglow;
