import React, { Component } from 'react';
import { View, Image, ScrollView } from 'react-native';
import { sectionListData } from './sectionListData';
import { styles } from './styles';
import ArduinoPins from "./pins/section";

export class ArduinoScreen extends React.Component {
  render() {
    return (
      <ScrollView>
        <View style={styles.container}>
          <Image style={styles.image} source={require('./images/arduinoUno.png')} />
          { sectionListData.map((section, index) =>
          <ArduinoPins key={index} pins={section} />
          )}
        </View>
      </ScrollView>
    );
  }
}
