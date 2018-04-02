import { AsyncStorage } from 'react-native';
import Transmitter from './transmitter';

class Settings {
  async send() {
    await AsyncStorage.getAllKeys().then((keys) => {
      for (let key of keys) {
        AsyncStorage.getItem(key).then((value) => {
          const command = key.replace('setting-', '');
          Transmitter.send(command + (value === 'true' ? 1 : 0));
        });
      }
    });
  }

  async clearAll() {
    await AsyncStorage.getAllKeys().then((keys) => {
      for (let key of keys) {
        AsyncStorage.removeItem(key);
      }
    });
  }
}

export default (new Settings);