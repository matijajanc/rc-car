import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ConnectionContainer from './src/components/Connection/ConnectionContainer';
import HomeContainer from './src/components/Home/HomeContainer';
import SpeedContainer from './src/components/Speed/SpeedContainer';
import SteerCalibrateContainer from './src/components/SteerCalibrate/SteerCalibrateContainer';
import ArduinoContainer from './src/components/Arduino/ArduinoContainer';
import DriveModeButtonsContainer from './src/components/DriveModeButtons/DriveModeButtonsContainer';
import DiagnosticsContainer from './src/components/Diagnostics/DiagnosticsContainer';
import ConnectionDot from './src/components/Common/ConnectionDot/ConnectionDot';
import { navigationRef } from './src/navigation/navigationRef';
import { startDiagnostics } from './src/utils/diagnostics';

/** Route names + params. Screens get typed navigation from this. */
export type RootStackParamList = {
  Connect: undefined;
  Home: undefined;
  Speed: undefined;
  SteerCalibrate: undefined;
  Arduino: undefined;
  DriveWithButtons: undefined;
  Diagnostics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  useEffect(() => {
    startDiagnostics();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Connect" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Connect" component={ConnectionContainer} />
          <Stack.Screen name="Home" component={HomeContainer} />
          <Stack.Screen name="Speed" component={SpeedContainer} />
          <Stack.Screen name="SteerCalibrate" component={SteerCalibrateContainer} />
          <Stack.Screen name="Arduino" component={ArduinoContainer} />
          <Stack.Screen name="DriveWithButtons" component={DriveModeButtonsContainer} />
          <Stack.Screen name="Diagnostics" component={DiagnosticsContainer} />
        </Stack.Navigator>
      </NavigationContainer>
      {/* Always-on connection indicator (tap to open the connection log). */}
      <ConnectionDot />
    </SafeAreaProvider>
  );
}
