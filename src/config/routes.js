import { StackNavigator } from 'react-navigation';
import ConnectionContainer from "../components/Connection/ConnectionContainer";
import HomeContainer from "../components/Home/HomeContainer";
import ArduinoContainer from '../components/Arduino/ArduinoContainer';
import SpeedContainer from '../components/Speed/SpeedContainer';
import SteerCalibrateContainer from '../components/SteerCalibrate/SteerCalibrateContainer';
import DriveModeButtonsContainer from '../components/DriveModeButtons/DriveModeButtonsContainer';

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
      screen: DriveModeButtonsContainer
    }
  },
  {
    initialRouteName: 'Connect',
    headerMode: 'none'
  }
);