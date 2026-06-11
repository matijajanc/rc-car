import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConnectionContainer from './src/components/Connection/ConnectionContainer';
import HomeContainer from './src/components/Home/HomeContainer';
import SpeedContainer from './src/components/Speed/SpeedContainer';
import SteerCalibrateContainer from './src/components/SteerCalibrate/SteerCalibrateContainer';
import ArduinoContainer from './src/components/Arduino/ArduinoContainer';
import DriveModeButtonsContainer from './src/components/DriveModeButtons/DriveModeButtonsContainer';

/** Route names + params. Screens get typed navigation from this. */
export type RootStackParamList = {
  Connect: undefined;
  Home: undefined;
  Speed: undefined;
  SteerCalibrate: undefined;
  Arduino: undefined;
  DriveWithButtons: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Connect" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connect" component={ConnectionContainer} />
        <Stack.Screen name="Home" component={HomeContainer} />
        <Stack.Screen name="Speed" component={SpeedContainer} />
        <Stack.Screen name="SteerCalibrate" component={SteerCalibrateContainer} />
        <Stack.Screen name="Arduino" component={ArduinoContainer} />
        <Stack.Screen name="DriveWithButtons" component={DriveModeButtonsContainer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
