import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { styles } from './assets/styles/styles';
import Section from './Section';
import type { ArduinoSection } from './Section';

interface Props {
  data: ArduinoSection[];
}

const Arduino = ({ data }: Props): React.JSX.Element => (
  <ScrollView>
    <View style={styles.container}>
      <Image style={styles.image} source={require('./assets/images/arduinoUno.png')} />
      {data.map((section, index) => (
        <Section key={index} data={section} />
      ))}
    </View>
  </ScrollView>
);

export default Arduino;
