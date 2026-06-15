import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { styles } from './assets/styles/styles';
import ScreenHeader from '../../Common/ScreenHeader/ScreenHeader';
import Section from './Section';
import type { ArduinoSection } from './Section';

interface Props {
  data: ArduinoSection[];
}

const Arduino = ({ data }: Props): React.JSX.Element => (
  <View style={styles.screen}>
    <ScreenHeader title="Arduino Uno R3" />
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.imageWrap}>
        <Image style={styles.image} source={require('./assets/images/arduinoUno.png')} />
      </View>
      {data.map((section, index) => (
        <Section key={index} data={section} />
      ))}
    </ScrollView>
  </View>
);

export default Arduino;
