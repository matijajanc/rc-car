import { StackNavigator } from 'react-navigation';
import DriveModeButtonsScreen from '../screens/DriveMode/Buttons/DriveModeButtons';

import ConnectionContainer from "../components/Connection/ConnectionContainer";
import HomeContainer from "../components/Home/HomeContainer";
import ArduinoContainer from '../components/Arduino/ArduinoContainer';
import SpeedContainer from '../components/Speed/SpeedContainer';
import SteerCalibrateContainer from '../components/SteerCalibrate/SteerCalibrateContainer';

export const Routes = StackNavigator(
  {
    Connect: {
      screen: ConnectionContainer
    },
    Home: {
      screen: HomeContainer
    },
    Speed: {
      screen: SpeedContainer
    },
    SteerCalibrate: {
      screen: SteerCalibrateContainer
    },
    Arduino: {
      screen: ArduinoContainer
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