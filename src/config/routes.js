import { StackNavigator } from 'react-navigation';
import { ConnectScreen } from '../screens/Connect/Connect';
import { HomeScreen } from '../screens/Home/Home';
import { ArduinoScreen } from '../screens/Arduino/Arduino';
import { SteerCalibrateScreen } from "../screens/SteerCalibrate/SteerCalibrate";

export const Routes = StackNavigator(
  {
    Connect: {
      screen: ConnectScreen
    },
    Home: {
      screen: HomeScreen
    },
    Arduino: {
      screen: ArduinoScreen
    },
    SteerCalibrate: {
      screen: SteerCalibrateScreen
    }
  },
  {
    initialRouteName: 'Connect',
    headerMode: 'none'
  }
);