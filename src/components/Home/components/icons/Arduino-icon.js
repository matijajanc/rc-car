import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { styles } from '../assets/styles/styles';

// Microchip glyph (the original badge was empty). Stroke-based to read cleanly
// at small sizes on the coloured badge.
const ArduinoIcon = props => (
  <View style={[styles.svgBox, { backgroundColor: props.bgColor }]}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={6} y={6} width={12} height={12} rx={2} stroke={'#fff'} strokeWidth={1.7} />
      <Path
        d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"
        stroke={'#fff'}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

export default ArduinoIcon;
