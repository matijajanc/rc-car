import { StackNavigator } from 'react-navigation';
import { ConnectScreen } from '../screens/Connect/Connect';
import { HomeScreen } from '../screens/Home/Home';
import { ArduinoScreen } from '../screens/Arduino/Arduino';

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
    }
  },
  {
    initialRouteName: 'Connect',
    headerMode: 'none'
  }
);