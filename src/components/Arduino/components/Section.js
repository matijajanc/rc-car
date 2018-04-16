import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { styles } from "./assets/styles/styles";
import Pin from './Pin';

export default Section = props => {
  const { data } = props;
  return (
    <View>
      <Text style={styles.sectionHeader}>{data.title}</Text>
      {data.data.map((item, index) =>
        <Pin key={index} item={item}/>
      )}
    </View>
  )
}