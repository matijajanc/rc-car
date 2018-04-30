import { AsyncStorage } from 'react-native';
import Transmitter from './transmitter';

/**
 * For sending saved settings (enabled functions) to RC car
 */
class Settings {
  /**
   * Sends settings
   *
   * @returns {Promise.<void>}
   */
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

  /**
   * Clears all saved settings
   *
   * @returns {Promise.<void>}
   */
  async clearAll() {
    await AsyncStorage.getAllKeys().then((keys) => {
      for (let key of keys) {
        AsyncStorage.removeItem(key);
      }
    });
  }

  /**
   * Formats saved settings for sending.
   * Some of the settings are just on/off functions,
   * other like default maximum speed is an integer value
   *
   * @string value
   * @returns {*}
   */
  formatValue(value) {
    switch (value) {
      case 'true': return 1;
      case 'false': return 0;
      default: return value;
    }
  }
}

export default (new Settings);