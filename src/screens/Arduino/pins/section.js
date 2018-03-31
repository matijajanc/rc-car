import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { styles } from "../styles";
import Pins from "./pin";

export default class ArduinoPins extends React.Component {
  render() {
    const data = this.props.pins;
    return (
      <View>
        <Text style={styles.sectionHeader}>{ data.title }</Text>
        { data.data.map((item, index) => {
            return <Pins key={index} pins={item} />
          }
        )}
      </View>
    )
  }
}
