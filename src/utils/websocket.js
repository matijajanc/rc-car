import Config from 'react-native-config';

class WebSocketNodeJs {
  constructor() {
    this.socket = {};
  }

  createSocket(ip) {
    return this.set(new WebSocket('ws://'+ip+':'+Config.WS_PORT));
  }

  set(socket) {
    this.socket = socket;

    return this.socket;
  }

  get() {
    return this.socket;
  }
}

export default (new WebSocketNodeJs);