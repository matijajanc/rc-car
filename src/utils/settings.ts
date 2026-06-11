import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatSettingValue } from '../../shared/protocol';
import { send } from './transmitter';

const PREFIX = 'setting-';

/** Replay every stored setting to the car (booleans serialised as 1/0). */
export async function sendAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    if (!key.startsWith(PREFIX)) {
      continue;
    }
    const value = await AsyncStorage.getItem(key);
    send(`${key.replace(PREFIX, '')}${formatSettingValue(value)}`);
  }
}

/** Clear all persisted settings. */
export async function clearAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys);
}

export default { send: sendAll, clearAll };
