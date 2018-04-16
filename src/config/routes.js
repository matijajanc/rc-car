import { StackNavigator } from 'react-navigation';
import { SteerCalibrateScreen } from "../screens/SteerCalibrate/SteerCalibrate";
import { SpeedScreen } from "../screens/Speed/Speed";
import DriveModeButtonsScreen from '../screens/DriveMode/Buttons/DriveModeButtons';

import ConnectionContainer from "../components/Connection/ConnectionContainer";
import HomeContainer from "../components/Home/HomeContainer";
import ArduinoContainer from '../components/Arduino/ArduinoContainer';

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
      screen: ArduinoContainer
    },
    DriveWithButtons: {
      screen: DriveModeButtonsScreen
    }
  },
  {
    initialRouteName: 'Arduino',
    headerMode: 'none'
  }
);