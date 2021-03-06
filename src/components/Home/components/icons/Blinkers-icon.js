import React, { Component } from 'react';
import { View } from 'react-native';
import Svg,{G, Path} from 'react-native-svg';
import {styles} from '../assets/styles/styles';
import {colors} from "../../../../config/styles/colors";

export default BlinkersIcon = props =>
  <View style={[styles.svgBox, {'backgroundColor': props.bgColor}]}>
    <Svg width={18} height={9} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184.35 91.94">
      <G fill={colors.background}>
        <Path d="M436.24,728.81a2.1,2.1,0,0,1-.7-.12,2,2,0,0,1-1.3-1.88l0-17.54-38.42.06h0a2,2,0,0,1,0-4l40.42-.06h0a2,2,0,0,1,2,2l0,14.22,33.31-38.18-33.42-38.09,0,14.22a2,2,0,0,1-2,2l-38.42.06,0,30.26a2,2,0,0,1-2,2h0a2,2,0,0,1-2-2l0-32.27a2,2,0,0,1,2-2l38.42-.06,0-17.54a2,2,0,0,1,3.51-1.32L475.7,682a2,2,0,0,1,0,2.64l-38,43.51A2,2,0,0,1,436.24,728.81Z" transform="translate(-291.85 -637.54)"/>
        <Path d="M331.94,729.47a2,2,0,0,1-1.52-.69l-38.08-43.91a2,2,0,0,1,0-2.62l38-44a2,2,0,0,1,3.52,1.31l0,18.05,38.42-.06h0a2,2,0,0,1,1.41.58,2,2,0,0,1,.59,1.42l.06,47.83a2,2,0,0,1-2,2l-40.42.06h0a2,2,0,0,1,0-4l38.42,0-.06-43.84-38.42.06h0a2,2,0,0,1-2-2l0-14.68-33.33,38.65,37,42.6a2,2,0,0,1-1.51,3.31Z" transform="translate(-291.85 -637.54)"/>
      </G>
    </Svg>
  </View>