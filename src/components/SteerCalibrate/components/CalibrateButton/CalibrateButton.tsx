import React from 'react';
import { TouchableHighlight, Image } from 'react-native';
import styles from '../assets/styles/styles';

interface Props {
  callback: () => void;
}

const CalibrateButton = ({ callback }: Props): React.JSX.Element => (
  <TouchableHighlight style={[styles.button]} onPress={() => callback()}>
    <Image style={styles.arrow} source={require('../assets/images/arrow.png')} />
  </TouchableHighlight>
);

export default CalibrateButton;
