import React, { Component } from 'react';
import Svg,{G, Polygon, Polyline} from 'react-native-svg';
import styles from './assets/styles/styles';
import DashboardOption from '../../../../Common/DashboardOption/DashboardOption';

const Blinkers = props => {
  return (
    <Svg style={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 158.99 138.34">
      <G fill={props.fillSvg}>
      <Polygon points="2 136.34 79.3 2 156.99 136.11 2 136.34" style="fill: none;stroke: #fff;stroke-linecap: round;stroke-linejoin: round;stroke-width: 4px"/>
      <Polyline points="119.98 115.72 49.34 115.81 37.41 115.83 42.05 107.77 79.36 42.92 121.59 115.83" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style={{'fill': 'none', 'stroke': '#fff', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '4px'}}/>
      </G>
    </Svg>
  )
};

export default DashboardOption(Blinkers);