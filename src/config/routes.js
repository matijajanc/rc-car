import { StackNavigator } from 'react-navigation';
import { ConnectScreen } from '../screens/Connect/Connect';
import { HomeScreen } from '../screens/Home/Home';

export const Routes = StackNavigator(
  {
    Connect: {
      screen: ConnectScreen
    },
    Home: {
      screen: HomeScreen
    }
  },
  {
    initialRouteName: 'Connect',
    headerMode: 'none'
  }
);