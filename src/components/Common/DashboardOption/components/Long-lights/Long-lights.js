import React, { Component } from 'react';
import Svg,{Path, G} from 'react-native-svg';
import styles from './assets/styles/styles';
import DashboardOption from '../../../../Common/DashboardOption/DashboardOption';

const LongLights = props => {
  return (
    <Svg style={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 164.77 103.43">
      <G fill={props.fillSvg}>
        <Path
          d="M397.89,735.21c-15.62,0-22.63-26-22.65-51.81s6.95-51.6,22.52-51.62c14.15,0,31.28,5.7,44.77,14.87,15.39,10.45,23.87,23.5,23.89,36.75,0,29.51-41.53,51.77-68.51,51.81Zm-.05-99.43c-12.25,0-18.61,24-18.6,47.62s6.43,47.81,18.65,47.81v0c13.32,0,29.58-5.49,42.45-14.27,8.25-5.64,22.09-17.49,22.07-33.54S448.54,655.57,440.29,650C427.42,641.21,411.15,635.78,397.84,635.78Z"
          transform="translate(-301.65 -631.78)"/>
        <Path d="M303.65,641.94a2,2,0,0,1,0-4l63.21-.09h0a2,2,0,1,1,0,4l-63.22.09Z"
              transform="translate(-301.65 -631.78)"/>
        <Path d="M303.68,663.78a2,2,0,0,1,0-4l58.75-.08h0a2,2,0,1,1,0,4l-58.76.08Z"
              transform="translate(-301.65 -631.78)"/>
        <Path d="M303.71,685.63a2,2,0,1,1,0-4l56.52-.08h0a2,2,0,0,1,0,4l-56.53.08Z"
              transform="translate(-301.65 -631.78)"/>
        <Path d="M303.75,707.48a2,2,0,0,1,0-4l58.76-.09h0a2,2,0,0,1,0,4l-58.75.09Z"
              transform="translate(-301.65 -631.78)"/>
        <Path d="M303.77,729.32a2,2,0,1,1,0-4l63.22-.08h0a2,2,0,0,1,0,4l-63.22.08Z" transform="translate(-301.65 -631.78)" />
      </G>
    </Svg>
  )
};

export default DashboardOption(LongLights);