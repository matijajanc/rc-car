import React, {Component} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import styles from './assets/styles/styles';
import DashboardOption from '../../../../Common/DashboardOption/DashboardOption';

const Blinkers = props => {
  return (
    <Svg style={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 158.99 138.34">
      <G fill={props.fillSvg}>
        <Path
          d="M306.52,752a2,2,0,0,1-1.73-1,2,2,0,0,1,0-2l77.31-134.33a2,2,0,0,1,1.73-1h0a2,2,0,0,1,1.73,1l77.69,134.11a2,2,0,0,1-1.73,3l-155,.22Zm77.31-132.34L310,748,458,747.78Z"
          transform="translate(-304.52 -613.66)"/>
        <Path
          d="M341.93,731.49a2,2,0,0,1-1.73-3l41.95-72.9a2,2,0,0,1,1.73-1h0a2,2,0,0,1,1.73,1l36.64,63.26a2,2,0,1,1-3.46,2l-34.91-60.26-38.49,66.9,68.52-.1h0a2,2,0,0,1,0,4l-72,.11Z"
          transform="translate(-304.52 -613.66)"/>
      </G>
    </Svg>
  )
};

export default DashboardOption(Blinkers);