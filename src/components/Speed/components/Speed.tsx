import React from 'react';
import { StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';

interface Props {
  settings: { minimumValue: number; maximumValue: number; step: number };
  value: number;
  callback: (value: number) => void;
}

export default function Speed({ settings, value, callback }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={settings.minimumValue}
        maximumValue={settings.maximumValue}
        step={settings.step}
        value={value}
        onSlidingComplete={callback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  slider: { width: '100%', height: 40 },
});
