import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { EventRegister } from 'react-native-event-listeners';

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
import { WS_STATUS_EVENT } from './src/utils/websocket';
import type { WsStatus } from './src/utils/websocket';
import { receive } from './src/utils/receiver';
import { sendAll } from './src/utils/settings';
import { start as startPresence } from './src/utils/presence';
import { start as startCarLink } from './src/utils/car-link';
import { start as startAppLifecycle } from './src/utils/app-lifecycle';

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

    // Wire the session on every (re)connect — not just the first manual connect
    // (ConnectionContainer unmounts once you're driving, so it can't). This is
    // what makes auto-reconnect after a drop transparent: receive() must rebind
    // onmessage to the new socket, and sendAll() replays the car's persisted
    // settings; the rest are idempotent. sendAll() sends settings only — never a
    // drive command — so the car stays stopped until a deliberate press.
    const sub = EventRegister.addEventListener(WS_STATUS_EVENT, (s: WsStatus) => {
      if (s !== 'connected') {
        return;
      }
      receive();
      void sendAll();
      startPresence();
      startCarLink();
      startAppLifecycle();
    });
    return () => {
      EventRegister.removeEventListener(sub as string);
    };
  }, []);

  return (
    // GestureHandlerRootView must wrap the whole app (and fill the screen via
    // flex:1) so react-native-gesture-handler can intercept touches — without
    // it the drive buttons' gestures never fire.
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
