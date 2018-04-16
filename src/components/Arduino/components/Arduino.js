import React, { Component } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { styles } from './assets/styles/styles';
import Section from './Section';

export default Arduino = props =>
  <ScrollView>
    <View style={styles.container}>
      <Image style={styles.image} source={require('./assets/images/arduinoUno.png')}/>
      {props.data.map((section, index) =>
        <Section key={index} data={section} />
      )}
    </View>
  </ScrollView>