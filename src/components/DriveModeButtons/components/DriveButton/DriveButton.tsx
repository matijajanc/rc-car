import React from 'react';
import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import styles from '../assets/styles/styles';

interface Props {
  callbackBtnPress: () => void;
  callbackBtnRelease: () => void;
  additionalStyles?: StyleProp<ViewStyle>;
  arrow: React.ReactNode;
}

const DriveButton = ({
  callbackBtnPress,
  callbackBtnRelease,
  additionalStyles,
  arrow,
}: Props): React.JSX.Element => (
  <Pressable
    onPressIn={() => callbackBtnPress()}
    onPressOut={() => callbackBtnRelease()}
    style={({ pressed }) => [styles.button, additionalStyles, pressed && styles.buttonActive]}>
    {arrow}
  </Pressable>
);

export default DriveButton;
