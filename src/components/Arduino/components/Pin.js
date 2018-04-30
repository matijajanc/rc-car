import React, {Component} from 'react';
import {Text, View} from 'react-native';
import {styles} from "./assets/styles/styles";

/**
 * Displays Arduino pin id, description,
 * color of the wire and pin type (Input/Output)
 */
export default Pin = props => {
  const {item} = props;
  return (
    <View style={styles.listItem}>
      <Text style={styles.pin}>{item.pin}</Text>
      <Text style={styles.text}>{item.text}</Text>
      {item.hasOwnProperty('color') &&
      <Text style={styles.color}>{item.color}</Text>
      }
      <Text style={styles.type}>({item.type})</Text>
    </View>
  )
}