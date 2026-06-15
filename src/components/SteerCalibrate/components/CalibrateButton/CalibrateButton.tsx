import React from 'react';
import { TouchableHighlight } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import styles from '../assets/styles/styles';
import { colors } from '../../../../config/styles/theme';

interface Props {
  callback: () => void;
  direction: 'left' | 'right';
}

const CalibrateButton = ({ callback, direction }: Props): React.JSX.Element => (
  <TouchableHighlight
    style={styles.button}
    underlayColor={colors.surfacePressed}
    onPress={() => callback()}>
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke={colors.textPrimary}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </TouchableHighlight>
);

export default CalibrateButton;
