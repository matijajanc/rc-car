import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../../config/styles/colors';

interface Props {
  size?: number;
  color?: string;
}

/** Right-pointing chevron used as the "drill-in" affordance on Home rows. */
export default function ChevronIcon({ size = 18, color = colors.textMuted }: Props): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
