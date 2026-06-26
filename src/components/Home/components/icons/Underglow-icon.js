import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { styles } from '../assets/styles/styles';

// Bottom-strip ("underglow") glyph: a car body with a glowing bar beneath it.
const UnderglowIcon = props => (
  <View style={[styles.svgBox, { backgroundColor: props.bgColor }]}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 13l1.8-4.2C5.7 7.9 6.5 7.3 7.4 7.3h9.2c.9 0 1.7.6 2.1 1.5L20.5 13v3c0 .5-.4 1-1 1h-1.1a1.7 1.7 0 01-3.4 0H8.9a1.7 1.7 0 01-3.4 0H4.5c-.6 0-1-.5-1-1v-3z"
        fill="#fff"
      />
      <Rect x="5.5" y="19.8" width="13" height="2" rx="1" fill="#fff" opacity="0.85" />
    </Svg>
  </View>
);

export default UnderglowIcon;
