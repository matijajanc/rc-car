import { AsyncStorage } from 'react-native';
import Transmitter from './transmitter';

class Settings {
  async send() {
    await AsyncStorage.getAllKeys().then((keys) => {
      for (let key of keys) {
        AsyncStorage.getItem(key).then((value) => {
          const command = key.replace('setting-', '');
          Transmitter.send(command + this.formatValue(value));
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

  formatValue(value) {
    switch (value) {
      case 'true': return 1;
      case 'false': return 0;
      default: return value;
    }
  }
}

export default (new Settings);