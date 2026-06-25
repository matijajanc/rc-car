/**
 * @format
 */

// Must be the first import: react-native-gesture-handler requires it at the top
// of the entry file so its native module is initialised before anything renders.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
