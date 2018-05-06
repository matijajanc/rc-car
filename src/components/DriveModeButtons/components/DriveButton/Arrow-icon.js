import React, { Component } from 'react';
import Svg,{Path} from 'react-native-svg';

export default ArrowIcon = props =>
  <Svg width={50} height={50} viewBox="0 0 100 100">
    <Path fill={'#444'} opacity={1} {...props} d="M30.928,94.168l42.16-42.16c1.109-1.109,1.109-2.908,0-4.016l-42.16-42.16c-1.109-1.109-2.906-1.109-4.017,0
	c-0.554,0.555-0.831,1.281-0.831,2.007c0,0.728,0.277,1.454,0.831,2.009L67.066,50L26.912,90.152
	c-0.555,0.557-0.831,1.281-0.831,2.008s0.276,1.453,0.831,2.008C28.021,95.277,29.818,95.277,30.928,94.168z"/>
  </Svg>