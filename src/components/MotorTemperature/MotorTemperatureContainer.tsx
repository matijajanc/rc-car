import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../../shared/protocol';
import { colors } from '../../config/styles/colors';
import { clampPercent, motorZone, segmentsLit } from '../../utils/gauges';

// Original segmented gauge, reconstructed from the 2018 SVG and rendered
// declaratively (no extractBrush / setNativeProps — removed in svg v15).
const VIEW_BOX = '0 0 129.49 183.76';
const SEGMENT_COUNT = 39;

interface Segment {
  id: number;
  x: string;
  y: string;
  width: string;
  height: string;
  transform: string;
}

const SEGMENTS: Segment[] = [
  {
    id: 39,
    x: '393.26',
    y: '592.32',
    width: '1',
    height: '12',
    transform: 'translate(717.13 -322.28) rotate(96)',
  },
  {
    id: 38,
    x: '392.76',
    y: '596.68',
    width: '1',
    height: '12',
    transform: 'translate(726.55 -305.73) rotate(97)',
  },
  {
    id: 37,
    x: '392.19',
    y: '601.04',
    width: '1',
    height: '12',
    transform: 'translate(735.64 -288.88) rotate(98)',
  },
  {
    id: 36,
    x: '391.54',
    y: '605.38',
    width: '1',
    height: '12',
    transform: 'translate(744.4 -271.72) rotate(99)',
  },
  {
    id: 35,
    x: '390.82',
    y: '609.72',
    width: '1',
    height: '12',
    transform: 'translate(752.8 -254.27) rotate(100)',
  },
  {
    id: 34,
    x: '390.01',
    y: '614.04',
    width: '1',
    height: '12',
    transform: 'translate(760.85 -236.53) rotate(101)',
  },
  {
    id: 33,
    x: '389.14',
    y: '618.34',
    width: '1',
    height: '12',
    transform: 'translate(768.52 -218.51) rotate(102)',
  },
  {
    id: 32,
    x: '388.19',
    y: '622.63',
    width: '1',
    height: '12',
    transform: 'translate(775.82 -200.21) rotate(103)',
  },
  {
    id: 31,
    x: '387.16',
    y: '626.9',
    width: '1',
    height: '12',
    transform: 'translate(782.72 -181.66) rotate(104)',
  },
  {
    id: 30,
    x: '386.06',
    y: '631.16',
    width: '1',
    height: '12',
    transform: 'translate(789.23 -162.85) rotate(105)',
  },
  {
    id: 29,
    x: '384.89',
    y: '635.39',
    width: '1',
    height: '12',
    transform: 'translate(795.33 -143.81) rotate(106)',
  },
  {
    id: 28,
    x: '383.64',
    y: '639.6',
    width: '1',
    height: '12',
    transform: 'translate(801.02 -124.52) rotate(107)',
  },
  {
    id: 27,
    x: '382.32',
    y: '643.8',
    width: '1',
    height: '12',
    transform: 'translate(806.28 -105.02) rotate(108)',
  },
  {
    id: 26,
    x: '380.92',
    y: '647.96',
    width: '1',
    height: '12',
    transform: 'translate(811.11 -85.3) rotate(109)',
  },
  {
    id: 25,
    x: '379.46',
    y: '652.1',
    width: '1',
    height: '12',
    transform: 'translate(815.5 -65.39) rotate(110)',
  },
  {
    id: 24,
    x: '377.92',
    y: '656.22',
    width: '1',
    height: '12',
    transform: 'translate(819.44 -45.28) rotate(111)',
  },
  {
    id: 23,
    x: '376.31',
    y: '660.31',
    width: '1',
    height: '12',
    transform: 'translate(822.93 -24.99) rotate(112)',
  },
  {
    id: 22,
    x: '374.63',
    y: '664.37',
    width: '1',
    height: '12',
    transform: 'translate(825.95 -4.54) rotate(113)',
  },
  {
    id: 21,
    x: '372.87',
    y: '668.4',
    width: '1',
    height: '12',
    transform: 'translate(828.51 16.07) rotate(114)',
  },
  {
    id: 20,
    x: '371.05',
    y: '672.39',
    width: '1',
    height: '12',
    transform: 'translate(830.59 36.82) rotate(115)',
  },
  {
    id: 19,
    x: '369.16',
    y: '676.36',
    width: '1',
    height: '12',
    transform: 'translate(832.19 57.71) rotate(116)',
  },
  {
    id: 18,
    x: '367.2',
    y: '680.29',
    width: '1',
    height: '12',
    transform: 'translate(833.3 78.71) rotate(117)',
  },
  {
    id: 17,
    x: '365.17',
    y: '684.19',
    width: '1',
    height: '12',
    transform: 'translate(833.92 99.81) rotate(118)',
  },
  {
    id: 16,
    x: '363.08',
    y: '688.05',
    width: '1',
    height: '12',
    transform: 'translate(834.04 121.01) rotate(119)',
  },
  {
    id: 15,
    x: '360.91',
    y: '691.87',
    width: '1',
    height: '12',
    transform: 'translate(833.67 142.29) rotate(120)',
  },
  {
    id: 14,
    x: '358.68',
    y: '695.66',
    width: '1',
    height: '12',
    transform: 'translate(832.79 163.63) rotate(121)',
  },
  {
    id: 13,
    x: '356.39',
    y: '699.41',
    width: '1',
    height: '12',
    transform: 'translate(831.4 185.03) rotate(122)',
  },
  {
    id: 12,
    x: '354.03',
    y: '703.11',
    width: '1',
    height: '12',
    transform: 'translate(829.5 206.46) rotate(123)',
  },
  {
    id: 11,
    x: '351.6',
    y: '706.78',
    width: '1',
    height: '12',
    transform: 'translate(827.08 227.92) rotate(124)',
  },
  {
    id: 10,
    x: '349.11',
    y: '710.4',
    width: '1',
    height: '12',
    transform: 'translate(824.15 249.39) rotate(125)',
  },
  {
    id: 9,
    x: '346.56',
    y: '713.97',
    width: '1',
    height: '12',
    transform: 'translate(820.7, 270.86) rotate(126)',
  },
  {
    id: 8,
    x: '343.95',
    y: '717.51',
    width: '1',
    height: '12',
    transform: 'translate(816.73 292.31) rotate(127)',
  },
  {
    id: 7,
    x: '341.27',
    y: '720.99',
    width: '1',
    height: '12',
    transform: 'translate(812.24 313.72) rotate(128)',
  },
  {
    id: 6,
    x: '338.54',
    y: '724.43',
    width: '1',
    height: '12',
    transform: 'translate(807.22 335.09) rotate(129)',
  },
  {
    id: 5,
    x: '335.74',
    y: '727.82',
    width: '1',
    height: '12',
    transform: 'translate(801.69 356.41) rotate(130)',
  },
  {
    id: 4,
    x: '332.89',
    y: '731.16',
    width: '1',
    height: '12',
    transform: 'translate(795.63, 377.64) rotate(131)',
  },
  {
    id: 3,
    x: '329.98',
    y: '734.45',
    width: '1',
    height: '12',
    transform: 'translate(789.05 398.79) rotate(132)',
  },
  {
    id: 2,
    x: '327.01',
    y: '737.69',
    width: '1',
    height: '12',
    transform: 'translate(781.94 419.83) rotate(133)',
  },
  {
    id: 1,
    x: '323.98',
    y: '740.88',
    width: '1',
    height: '12',
    transform: 'translate(774.32 440.76) rotate(134)',
  },
  {
    id: 0,
    x: '389.28',
    y: '595.9',
    width: '1',
    height: '4',
    transform: 'translate(712.32 -318.78) rotate(96)',
  },
  {
    id: 0,
    x: '388.79',
    y: '600.19',
    width: '1',
    height: '4',
    transform: 'translate(721.61 -302.34) rotate(97)',
  },
  {
    id: 0,
    x: '388.23',
    y: '604.48',
    width: '1',
    height: '4',
    transform: 'translate(730.58 -285.59) rotate(98)',
  },
  {
    id: 0,
    x: '387.59',
    y: '608.76',
    width: '1',
    height: '4',
    transform: 'translate(739.21 -268.54) rotate(99)',
  },
  {
    id: 0,
    x: '386.88',
    y: '613.02',
    width: '1',
    height: '4',
    transform: 'translate(747.49 -251.2) rotate(100)',
  },
  {
    id: 0,
    x: '386.09',
    y: '617.27',
    width: '1',
    height: '4',
    transform: 'translate(755.42 -233.58) rotate(101)',
  },
  {
    id: 0,
    x: '385.23',
    y: '621.51',
    width: '1',
    height: '4',
    transform: 'translate(762.98 -215.68) rotate(102)',
  },
  {
    id: 0,
    x: '384.29',
    y: '625.73',
    width: '1',
    height: '4',
    transform: 'translate(770.17 -197.52) rotate(103)',
  },
  {
    id: 0,
    x: '383.28',
    y: '629.94',
    width: '1',
    height: '4',
    transform: 'translate(776.96 -179.1) rotate(104)',
  },
  {
    id: 0,
    x: '382.2',
    y: '634.12',
    width: '1',
    height: '4',
    transform: 'translate(783.37 -160.43) rotate(105)',
  },
  {
    id: 0,
    x: '381.04',
    y: '638.29',
    width: '1',
    height: '4',
    transform: 'translate(789.37 -141.52) rotate(106)',
  },
  {
    id: 0,
    x: '379.81',
    y: '642.44',
    width: '1',
    height: '4',
    transform: 'translate(794.96 -122.38) rotate(107)',
  },
  {
    id: 0,
    x: '378.51',
    y: '646.56',
    width: '1',
    height: '4',
    transform: 'translate(800.13 -103.02) rotate(108)',
  },
  {
    id: 0,
    x: '377.14',
    y: '650.66',
    width: '1',
    height: '4',
    transform: 'translate(804.87 -83.45) rotate(109)',
  },
  {
    id: 0,
    x: '375.7',
    y: '654.74',
    width: '1',
    height: '4',
    transform: 'translate(809.17 -63.69) rotate(110)',
  },
  {
    id: 0,
    x: '374.18',
    y: '658.79',
    width: '1',
    height: '4',
    transform: 'translate(813.03 -43.74) rotate(111)',
  },
  {
    id: 0,
    x: '372.6',
    y: '662.81',
    width: '1',
    height: '4',
    transform: 'translate(816.44 -23.61) rotate(112)',
  },
  {
    id: 0,
    x: '370.94',
    y: '666.8',
    width: '1',
    height: '4',
    transform: 'translate(819.39 -3.32) rotate(113)',
  },
  {
    id: 0,
    x: '369.22',
    y: '670.77',
    width: '1',
    height: '4',
    transform: 'translate(821.88 17.12) rotate(114)',
  },
  {
    id: 0,
    x: '367.43',
    y: '674.7',
    width: '1',
    height: '4',
    transform: 'translate(823.9 37.7) rotate(115)',
  },
  {
    id: 0,
    x: '365.57',
    y: '678.61',
    width: '1',
    height: '4',
    transform: 'translate(825.44 58.42) rotate(116)',
  },
  {
    id: 0,
    x: '363.64',
    y: '682.48',
    width: '1',
    height: '4',
    transform: 'translate(826.5 79.24) rotate(117)',
  },
  {
    id: 0,
    x: '361.64',
    y: '686.31',
    width: '1',
    height: '4',
    transform: 'translate(827.07 100.17) rotate(118)',
  },
  {
    id: 0,
    x: '359.58',
    y: '690.11',
    width: '1',
    height: '4',
    transform: 'translate(827.15 121.19) rotate(119)',
  },
  {
    id: 0,
    x: '357.45',
    y: '693.87',
    width: '1',
    height: '4',
    transform: 'translate(826.74 142.29) rotate(120)',
  },
  {
    id: 0,
    x: '355.25',
    y: '697.6',
    width: '1',
    height: '4',
    transform: 'translate(825.83 163.45) rotate(121)',
  },
  {
    id: 0,
    x: '352.99',
    y: '701.29',
    width: '1',
    height: '4',
    transform: 'translate(824.41 184.66) rotate(122)',
  },
  {
    id: 0,
    x: '350.67',
    y: '704.93',
    width: '1',
    height: '4',
    transform: 'translate(822.49 205.91) rotate(123)',
  },
  {
    id: 0,
    x: '348.28',
    y: '708.54',
    width: '1',
    height: '4',
    transform: 'translate(820.06 227.18) rotate(124)',
  },
  {
    id: 0,
    x: '345.83',
    y: '712.1',
    width: '1',
    height: '4',
    transform: 'translate(817.12 248.46) rotate(125)',
  },
  {
    id: 0,
    x: '343.32',
    y: '715.62',
    width: '1',
    height: '4',
    transform: 'translate(813.66, 269.74) rotate(126)',
  },
  {
    id: 0,
    x: '340.75',
    y: '719.1',
    width: '1',
    height: '4',
    transform: 'translate(809.69 291) rotate(127)',
  },
  {
    id: 0,
    x: '338.12',
    y: '722.53',
    width: '1',
    height: '4',
    transform: 'translate(805.21 312.23) rotate(128)',
  },
  {
    id: 0,
    x: '335.43',
    y: '725.91',
    width: '1',
    height: '4',
    transform: 'translate(800.2 333.41) rotate(129)',
  },
  {
    id: 0,
    x: '332.68',
    y: '729.25',
    width: '1',
    height: '4',
    transform: 'translate(794.68 354.53) rotate(130)',
  },
  {
    id: 0,
    x: '329.87',
    y: '732.54',
    width: '1',
    height: '4',
    transform: 'translate(788.65, 375.58) rotate(131)',
  },
  {
    id: 0,
    x: '327',
    y: '735.78',
    width: '1',
    height: '4',
    transform: 'translate(782.1 396.53) rotate(132)',
  },
  {
    id: 0,
    x: '324.08',
    y: '738.97',
    width: '1',
    height: '4',
    transform: 'translate(775.03 417.39) rotate(133)',
  },
  {
    id: 0,
    x: '321.11',
    y: '742.1',
    width: '1',
    height: '4',
    transform: 'translate(767.45 438.12) rotate(134)',
  },
];
const PATHS: { d: string; transform?: string; fill: string }[] = [
  {
    d: 'M386.84,591.79l-3-.26c-.08,1-.17,2-.26,3A240.6,240.6,0,0,1,315,741.44l-2.12,2.12,2.2,2.2,9.56,9.56,2.12-2.12-9.56-9.56a242.4,242.4,0,0,0,69.44-148.86L400,596l.26-3Z',
    transform: 'translate(-312.83 -591.53)',
    fill: '#fff',
  },
];
const CIRCLES: { cx: string; cy: string; r: string; fill: string }[] = [];
const TEXTS: { transform?: string; fill: string; content: string }[] = [
  { transform: 'translate(102.31 12.83)', fill: '#fff', content: '100°' },
  { transform: 'translate(77.74 101.99)', fill: '#fff', content: '50°' },
  { transform: 'translate(23.42 179.7)', fill: '#fff', content: '0°' },
];

export default function MotorTemperatureContainer(): React.JSX.Element {
  const [raw, setRaw] = useState(0);

  useEffect(() => {
    const id = EventRegister.addEventListener('wsReceive', (data: Telemetry) => {
      if (data.code === TELEMETRY_CODES.MOTOR_TEMP) {
        setRaw(Number(data.value));
      }
    });
    return () => {
      EventRegister.removeEventListener(id as string);
    };
  }, []);

  const fillLevel = clampPercent(raw); // 0..100 along the arc
  const end = segmentsLit(fillLevel, SEGMENT_COUNT);
  const zone = motorZone(raw);
  const color = zone === 0 ? colors.green : zone === 1 ? colors.orange : colors.red;

  return (
    <View style={styles.box}>
      <Svg width={102} height={145} viewBox={VIEW_BOX}>
        {PATHS.map((p, i) => (
          <Path key={`p${i}`} d={p.d} transform={p.transform} fill={p.fill} />
        ))}
        {CIRCLES.map((c, i) => (
          <Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} />
        ))}
        {SEGMENTS.map((s) => {
          const on = s.id <= end;
          return (
            <Rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              transform={s.transform}
              fill={on ? color : '#fff'}
              opacity={on ? 1 : 0.7}
            />
          );
        })}
        {TEXTS.map((t, i) => (
          <SvgText key={`t${i}`} transform={t.transform} fill={t.fill} fontSize={10}>
            {t.content}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Battery (above) is flex-end and motor-temp is flex-start so the two arcs
  // meet at the vertical centre and nest into one continuous gauge.
  box: { height: '50%', justifyContent: 'flex-start', alignItems: 'center' },
});
