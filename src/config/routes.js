import { StackNavigator } from 'react-navigation';
import { ConnectScreen } from '../screens/Connect/Connect';
import { HomeScreen } from '../screens/Home/Home';
import { ArduinoScreen } from '../screens/Arduino/Arduino';
import { SteerCalibrateScreen } from "../screens/SteerCalibrate/SteerCalibrate";
import { SpeedScreen } from "../screens/Speed/Speed";
import DriveModeButtonsScreen from '../screens/DriveMode/Buttons/DriveModeButtons';

export const Routes = StackNavigator(
  {
    Connect: {
      screen: ConnectScreen
    },
    Home: {
      screen: HomeScreen
    },
    Speed: {
      screen: SpeedScreen
    },
    SteerCalibrate: {
      screen: SteerCalibrateScreen
    },
    Arduino: {
      screen: ArduinoScreen
    },
    DriveWithButtons: {
      screen: DriveModeButtonsScreen
    }
  },
  {
    initialRouteName: 'Connect',
    headerMode: 'none'
  }
);