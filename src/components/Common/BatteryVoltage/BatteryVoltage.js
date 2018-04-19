import React, { Component } from 'react';

import extractBrush from 'react-native-svg/lib/extract/extractBrush';

import Svg,{
  Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Text,
  Use,
  Defs,
  Stop
} from 'react-native-svg';

import { View, Image } from 'react-native';
import styles from "./assets/styles/styles";

//export default BatteryLevel = props => {
export default class BatteryLevel extends React.Component {
  constructor(props) {
    super(props);
    this.temperature = this.calculate(props.batteryVoltage);
    console.log("oKKK");
    console.log(props.batteryVoltage);

    switch (this.temperature) {
      case (this.temperature < 40):
        this.fillSvg();
        break;
      case (this.temperature > 40 && this.temperature < 80):
        this.fillSvg();
        break;
      case (this.temperature > 80):
        this.fillSvg();
        break;
    }

  };

  calculate = (temperature) => {
    if (parseInt(temperature) > 0) {
      return parseInt((39 * parseInt(temperature)) / 100);
    } else {
      return 1;
    }
  };

  fillSvg = (e) => {
    if (e && e.props.id < 100) {
      console.log(e);
      console.log(e.props.id);
      e.setNativeProps({fill: extractBrush('#f00')});
      return '#00f';
    }

    return '#fff';
  };

  render() {
    return <View style={styles.batteryLevelBox}>
      <Svg width={87} height={145}>
        <Path fill="#fff"
              d="M416,767l-13.44,1.18a242.4,242.4,0,0,0-69.44-148.86l9.56-9.56-2.12-2.12L331,617.24l-2.2,2.2,2.12,2.12a240.6,240.6,0,0,1,68.63,146.92c.09,1,.18,2,.26,3l3-.26L416.29,770Z"
              transform="translate(-328.83 -591.02)"/>
        <Rect id="39" ref={(c) => this.fillSvg(c)} fill="#fff" x="339.98" y="610.12" width="1" height="12"
              transform="translate(218.34 -647.82) rotate(46)"/>
        <Rect id="38" fill="#fff" x="343.01" y="613.31" width="1" height="12"
              transform="translate(233.34 -645.31) rotate(47)"/>
        <Rect id="37" fill="#fff" x="345.98" y="616.55" width="1" height="12"
              transform="translate(248.45 -642.52) rotate(48)"/>
        <Rect id="36" fill="#fff" x="348.89" y="619.84" width="1" height="12"
              transform="translate(263.67 -639.46) rotate(49)"/>
        <Rect id="35" fill="#fff" x="351.74" y="623.18" width="1" height="12"
              transform="translate(278.98 -636.11) rotate(50)"/>
        <Rect id="34" fill="#fff" x="354.54" y="626.57" width="1" height="12"
              transform="translate(294.38 -632.46) rotate(51)"/>
        <Rect id="33" fill="#fff" x="357.27" y="630.01" width="1" height="12"
              transform="matrix(0.62, 0.79, -0.79, 0.62, 309.86, -628.51)"/>
        <Rect id="32" fill="#fff" x="359.95" y="633.49" width="1" height="12"
              transform="translate(325.42 -624.25) rotate(53)"/>
        <Rect id="31" fill="#fff" x="362.56" y="637.03" width="1" height="12"
              transform="translate(341.05 -619.68) rotate(54)"/>
        <Rect id="30" fill="#fff" x="365.11" y="640.6" width="1" height="12"
              transform="translate(356.74 -614.79) rotate(55)"/>
        <Rect id="29" fill="#fff" x="367.6" y="644.22" width="1" height="12"
              transform="translate(372.49 -609.57) rotate(56)"/>
        <Rect id="28" fill="#fff" x="370.03" y="647.89" width="1" height="12"
              transform="translate(388.29 -604.02) rotate(57)"/>
        <Rect id="27" fill="#fff" x="372.39" y="651.59" width="1" height="12"
              transform="translate(404.13 -598.13) rotate(58)"/>
        <Rect id="26" fill="#fff" x="374.68" y="655.34" width="1" height="12"
              transform="translate(420 -591.89) rotate(59)"/>
        <Rect id="25" fill="#fff" x="376.91" y="659.13" width="1" height="12"
              transform="translate(435.89 -585.31) rotate(60)"/>
        <Rect id="24" fill="#fff" x="379.08" y="662.95" width="1" height="12"
              transform="translate(451.8 -578.37) rotate(61)"/>
        <Rect id="23" fill="#fff" x="381.17" y="666.81" width="1" height="12"
              transform="translate(467.72 -571.07) rotate(62)"/>
        <Rect id="22" fill="#fff" x="383.2" y="670.71" width="1" height="12"
              transform="translate(483.63 -563.41) rotate(63)"/>
        <Rect id="21" fill="#fff" x="385.16" y="674.64" width="1" height="12"
              transform="translate(499.53 -555.39) rotate(64)"/>
        <Rect id="20" fill="#fff" x="387.05" y="678.61" width="1" height="12"
              transform="translate(515.4 -546.99) rotate(65)"/>
        <Rect id="19" fill="#fff" x="388.87" y="682.6" width="1" height="12"
              transform="translate(531.25 -538.21) rotate(66)"/>
        <Rect id="18" fill="#fff" x="390.63" y="686.63" width="1" height="12"
              transform="translate(547.05 -529.06) rotate(67)"/>
        <Rect id="17" fill="#fff" x="392.31" y="690.69" width="1" height="12"
              transform="translate(562.8 -519.52) rotate(68)"/>
        <Rect id="16" fill="#fff" x="393.92" y="694.78" width="1" height="12"
              transform="translate(578.48 -509.6) rotate(69)"/>
        <Rect id="15" fill="#fff" x="395.46" y="698.9" width="1" height="12"
              transform="translate(594.09 -499.29) rotate(70)"/>
        <Rect id="14" fill="#fff" x="396.92" y="703.04" width="1" height="12"
              transform="translate(609.62 -488.6) rotate(71)"/>
        <Rect id="13" fill="#fff" x="398.32" y="707.2" width="1" height="12"
              transform="translate(625.05 -477.51) rotate(72)"/>
        <Rect id="12" fill="#fff" x="399.64" y="711.4" width="1" height="12"
              transform="translate(640.37 -466.03) rotate(73)"/>
        <Rect id="11" fill="#fff" x="400.89" y="715.61" width="1" height="12"
              transform="translate(655.58 -454.16) rotate(74)"/>
        <Rect id="10" fill="#fff" x="402.06" y="719.84" width="1" height="12"
              transform="translate(670.65 -441.89) rotate(75)"/>
        <Rect id="9" fill="#fff" x="403.16" y="724.1" width="1" height="12"
              transform="translate(685.59 -429.22) rotate(76)"/>
        <Rect id="8" fill="#fff" x="404.19" y="728.37" width="1" height="12"
              transform="translate(700.37 -416.17) rotate(77)"/>
        <Rect id="7" fill="#fff" x="405.14" y="732.66" width="1" height="12"
              transform="translate(714.99 -402.72) rotate(78)"/>
        <Rect id="6" fill="#fff" x="406.01" y="736.96" width="1" height="12"
              transform="translate(729.44 -388.87) rotate(79)"/>
        <Rect id="5" fill="#fff" x="406.82" y="741.28" width="1" height="12"
              transform="translate(743.69 -374.63) rotate(80)"/>
        <Rect id="4" fill="#fff" x="407.54" y="745.62" width="1" height="12"
              transform="translate(757.75 -360) rotate(81)"/>
        <Rect id="3" fill="#fff" x="408.19" y="749.96" width="1" height="12"
              transform="translate(771.59 -344.98) rotate(82)"/>
        <Rect id="2" fill="#fff" x="408.76" y="754.32" width="1" height="12"
              transform="translate(785.21 -329.58) rotate(83)"/>
        <Rect id="1" fill="#fff" x="409.26" y="758.68" width="1" height="12"
              transform="translate(798.6 -313.79) rotate(84)"/>
        <Rect id="39" fill="#fff" x="337.11" y="616.9" width="1" height="4"
              transform="translate(219.46 -644.9) rotate(46)"/>
        <Rect id="0_38" fill="#fff" x="340.08" y="620.03" width="1" height="4"
              transform="translate(234.41 -642.3) rotate(47)"/>
        <Rect id="0_37" fill="#fff" x="343" y="623.22" width="1" height="4"
              transform="translate(249.46 -639.43) rotate(48)"/>
        <Rect id="0_36" fill="#fff" x="345.87" y="626.46" width="1" height="4"
              transform="translate(264.61 -636.28) rotate(49)"/>
        <Rect id="0_35" fill="#fff" x="348.68" y="629.75" width="1" height="4"
              transform="translate(279.85 -632.84) rotate(50)"/>
        <Rect id="0_34" fill="#fff" x="351.43" y="633.09" width="1" height="4"
              transform="translate(295.18 -629.11) rotate(51)"/>
        <Rect id="0_33" fill="#fff" x="354.12" y="636.47" width="1" height="4"
              transform="matrix(0.62, 0.79, -0.79, 0.62, 310.59, -625.08)"/>
        <Rect id="0_32" fill="#fff" x="356.75" y="639.9" width="1" height="4"
              transform="translate(326.07 -620.74) rotate(53)"/>
        <Rect id="0_31" fill="#fff" x="359.32" y="643.38" width="1" height="4"
              transform="translate(341.62 -616.09) rotate(54)"/>
        <Rect id="0_30" fill="#fff" x="361.83" y="646.9" width="1" height="4"
              transform="translate(357.23 -611.13) rotate(55)"/>
        <Rect id="0_29" fill="#fff" x="364.28" y="650.46" width="1" height="4"
              transform="translate(372.89 -605.83) rotate(56)"/>
        <Rect id="0_28" fill="#fff" x="366.67" y="654.07" width="1" height="4"
              transform="translate(388.59 -600.21) rotate(57)"/>
        <Rect id="0_27" fill="#fff" x="368.99" y="657.71" width="1" height="4"
              transform="translate(404.33 -594.25) rotate(58)"/>
        <Rect id="0_26" fill="#fff" x="371.25" y="661.4" width="1" height="4"
              transform="translate(420.1 -587.95) rotate(59)"/>
        <Rect id="0_25" fill="#fff" x="373.45" y="665.12" width="1" height="4"
              transform="translate(435.89 -581.31) rotate(60)"/>
        <Rect id="0_24" fill="#fff" x="375.58" y="668.89" width="1" height="4"
              transform="translate(451.7 -574.31) rotate(61)"/>
        <Rect id="0_23" fill="#fff" x="377.64" y="672.69" width="1" height="4"
              transform="translate(467.5 -566.96) rotate(62)"/>
        <Rect id="0_22" fill="#fff" x="379.64" y="676.52" width="1" height="4"
              transform="translate(483.3 -559.25) rotate(63)"/>
        <Rect id="0_21" fill="#fff" x="381.57" y="680.39" width="1" height="4"
              transform="translate(499.08 -551.17) rotate(64)"/>
        <Rect id="0_20" fill="#fff" x="383.43" y="684.3" width="1" height="4"
              transform="translate(514.84 -542.72) rotate(65)"/>
        <Rect id="0_19" fill="#fff" x="385.22" y="688.23" width="1" height="4"
              transform="translate(530.57 -533.91) rotate(66)"/>
        <Rect id="0_18" fill="#fff" x="386.94" y="692.2" width="1" height="4"
              transform="translate(546.24 -524.72) rotate(67)"/>
        <Rect id="0_17" fill="#fff" x="388.6" y="696.19" width="1" height="4"
              transform="translate(561.87 -515.15) rotate(68)"/>
        <Rect id="0_16" fill="#fff" x="390.18" y="700.21" width="1" height="4"
              transform="translate(577.42 -505.2) rotate(69)"/>
        <Rect id="0_15" fill="#fff" x="391.7" y="704.26" width="1" height="4"
              transform="translate(592.9 -494.86) rotate(70)"/>
        <Rect id="0_14" fill="#fff" x="393.14" y="708.34" width="1" height="4"
              transform="translate(608.3 -484.14) rotate(71)"/>
        <Rect id="0_13" fill="#fff" x="394.51" y="712.44" width="1" height="4"
              transform="translate(623.6 -473.04) rotate(72)"/>
        <Rect id="0_12" fill="#fff" x="395.81" y="716.56" width="1" height="4"
              transform="translate(638.78 -461.54) rotate(73)"/>
        <Rect id="0_11" fill="#fff" x="397.04" y="720.71" width="1" height="4"
              transform="translate(653.85 -449.66) rotate(74)"/>
        <Rect id="0_10" fill="#fff" x="398.2" y="724.88" width="1" height="4"
              transform="translate(668.79 -437.39) rotate(75)"/>
        <Rect id="0_9" fill="#fff" x="399.28" y="729.06" width="1" height="4"
              transform="translate(683.59 -424.73) rotate(76)"/>
        <Rect id="0_8" fill="#fff" x="400.29" y="733.27" width="1" height="4"
              transform="translate(698.23 -411.67) rotate(77)"/>
        <Rect id="0_7" fill="#fff" x="401.23" y="737.49" width="1" height="4"
              transform="translate(712.71 -398.23) rotate(78)"/>
        <Rect id="0_6" fill="#fff" x="402.09" y="741.73" width="1" height="4"
              transform="translate(727.01 -384.4) rotate(79)"/>
        <Rect id="0_5" fill="#fff" x="402.88" y="745.98" width="1" height="4"
              transform="translate(741.12 -370.18) rotate(80)"/>
        <Rect id="0_4" fill="#fff" x="403.59" y="750.24" width="1" height="4"
              transform="translate(755.03 -355.57) rotate(81)"/>
        <Rect id="0_3" fill="#fff" x="404.23" y="754.52" width="1" height="4"
              transform="translate(768.73 -340.58) rotate(82)"/>
        <Rect id="0_2" fill="#fff" x="404.79" y="758.81" width="1" height="4"
              transform="translate(782.21 -325.21) rotate(83)"/>
        <Rect id="0_1" fill="#fff" x="405.28" y="763.1" width="1" height="4"
              transform="translate(795.45 -309.45) rotate(84)"/>
        <Circle fill="#fff" cx="23.42" cy="7.12" r="7.12"/>
        <Path fill="#fff"
              d="M431.84,774.79a7.63,7.63,0,1,1,7.63-7.63A7.63,7.63,0,0,1,431.84,774.79Zm0-14.25a6.63,6.63,0,1,0,6.63,6.62A6.63,6.63,0,0,0,431.84,760.54Z"
              transform="translate(-328.83 -591.02)"/>
        <Path fill="#fff"
              d="M406.53,668.13a7.63,7.63,0,1,0,7.63,7.63A7.63,7.63,0,0,0,406.53,668.13Zm0,1a6.64,6.64,0,0,1,6.63,6.63H399.91A6.63,6.63,0,0,1,406.53,669.13Z"
              transform="translate(-328.83 -591.02)"/>
      </Svg>
    </View>
  }
}