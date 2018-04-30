// INCOMING DATA (ARDUINO DATA)
// mt -> motor temperature
// sp -> car speed
// bv -> battery voltage
// rs -> range sensor problem

import WebSocketNodeJs from './websocket';
import { EventRegister } from 'react-native-event-listeners';

/**
 * Registering event listener for receiving RC
 * car data through websockets.
 * We are receiving speed, battery voltage, motor temperature
 */
export default class Receiver {
  static receive() {
    const socket = WebSocketNodeJs.get();
    socket.onmessage = (data) => {
      const stopChar = /[^X]*/.exec(data.data)[0];
      const option = stopChar.substring(0, 2);
      const value = stopChar.substring(2);
      EventRegister.emit('wsReceive', {option, value});
    };
  }
}