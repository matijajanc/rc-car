import React from 'react';
import { View, ViewProps } from 'react-native';
import styles from './assets/styles/styles';

/** Wraps screen content with the app's container styling. */
export default function Container({ children, style, ...props }: ViewProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}
