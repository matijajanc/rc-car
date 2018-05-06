import React, { Component } from 'react';
import { View } from 'react-native';
import Svg,{G, Path} from 'react-native-svg';
import {styles} from '../assets/styles/styles';
import {colors} from "../../../../config/styles/colors";

export default RangeSensorsIcon = props =>
  <View style={[styles.svgBox, {'backgroundColor': props.bgColor}]}>
    <Svg width={18} height={11} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172.61 106.03">
      <G fill={colors.background}>
        <Path d="M442,720.31a2,2,0,0,1-1.42-3.41,30.35,30.35,0,0,0,0-42.89,2,2,0,0,1,2.83-2.83,34.36,34.36,0,0,1,0,48.55A2,2,0,0,1,442,720.31Z" transform="translate(-300.22 -630.18)"/>
        <Path d="M455.68,734a2,2,0,0,1-1.41-3.42,49.73,49.73,0,0,0,0-70.32,2,2,0,0,1,2.83-2.82,53.73,53.73,0,0,1,0,76A2,2,0,0,1,455.68,734Z" transform="translate(-300.22 -630.18)"/>
        <Path d="M376.38,736.22a21.39,21.39,0,1,1,21.38-21.39A21.41,21.41,0,0,1,376.38,736.22Zm0-38.77a17.39,17.39,0,1,0,17.38,17.38A17.41,17.41,0,0,0,376.38,697.45Z" transform="translate(-300.22 -630.18)"/>
        <Path d="M357,713.48H302.22a2,2,0,0,1,0-4H357a2,2,0,0,1,0,4Z" transform="translate(-300.22 -630.18)"/>
        <Path d="M410.7,713.48H395.76a2,2,0,0,1,0-4H410.7c1.12,0,4.06-2.88,7.22-13.78a104.81,104.81,0,0,0,3.63-18.45l-45-10.66a2,2,0,0,1-1.07-.66l-26.71-31.75h-33a2,2,0,1,1,0-4h34a2,2,0,0,1,1.54.72l26.87,32,46,10.89a2,2,0,0,1,1.54,1.94c0,3.76-1.47,12.91-3.86,21.14C418.51,708,414.89,713.48,410.7,713.48Z" transform="translate(-300.22 -630.18)"/>
        <Path d="M358.93,673.43h-47.7a2,2,0,0,1-1.48-.66,2,2,0,0,1-.51-1.53L311.75,645a2,2,0,0,1,2-1.81H340.8a2,2,0,0,1,1.64.86c5.3,7.58,17.71,25.34,18.27,26.46a2,2,0,0,1-1.78,2.9Zm-45.49-4h41.75c-3.35-4.91-10.26-14.81-15.44-22.22H315.56Z" transform="translate(-300.22 -630.18)"/>
        <Path d="M296.05,671.43" transform="translate(-300.22 -630.18)"/>
        <Path d="M315.7,634.18H302.22a2,2,0,0,1,0-4H315.7a2,2,0,0,1,0,4Z" transform="translate(-300.22 -630.18)"/>
      </G>
    </Svg>
  </View>