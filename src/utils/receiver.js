import WebSocketNodeJs from './websocket';
import { EventRegister } from 'react-native-event-listeners';

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