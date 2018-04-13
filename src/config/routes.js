import { StackNavigator } from 'react-navigation';
import { ArduinoScreen } from '../screens/Arduino/Arduino';
import { SteerCalibrateScreen } from "../screens/SteerCalibrate/SteerCalibrate";
import { SpeedScreen } from "../screens/Speed/Speed";
import DriveModeButtonsScreen from '../screens/DriveMode/Buttons/DriveModeButtons';
import {ConnectionContainer} from "../components/Connection/ConnectionContainer";
import {HomeContainer} from "../components/Home/HomeContainer";

export const Routes = StackNavigator(
  {
    Connect: {
      screen: ConnectionContainer
    },
    Home: {
      screen: HomeContainer
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
    initialRouteName: 'Home',
    headerMode: 'none'
  }
);