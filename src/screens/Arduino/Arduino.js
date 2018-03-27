import React, { Component } from 'react';
import { Text, View, Image, SectionList } from 'react-native';
import { sectionListData } from './sectionListData';
import { styles } from './styles';

export class ArduinoScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Image style={styles.image} source={require('./images/arduinoUno.png')}/>
        <View >
          <SectionList
            sections={sectionListData}
            renderSectionHeader={ ({section}) => <Text style={styles.sectionHeader}>{ section.title }</Text> }
            renderItem={({item}) => {
                return (
                  <View style={ styles.listItem }>
                    <Text style={styles.pin}>{ item.pin }</Text>
                    <Text style={styles.text}>{ item.text }</Text>
                    <Text style={styles.type}>({ item.type })</Text>
                    { item.hasOwnProperty('color') &&
                    <Text style={styles.color}>{ item.color }</Text>
                    }
                  </View>
                );
              }
            }
            keyExtractor={ (item, index) => index }
          />
        </View>
      </View>
    );
  }
}
