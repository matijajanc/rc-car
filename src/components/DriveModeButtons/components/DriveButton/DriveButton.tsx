import React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
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
  <TouchableWithoutFeedback
    onPressIn={() => callbackBtnPress()}
    onPressOut={() => callbackBtnRelease()}>
    <View style={[styles.button, additionalStyles]}>{arrow}</View>
  </TouchableWithoutFeedback>
);

export default DriveButton;
