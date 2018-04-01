import Config from 'react-native-config';

class WebSocketNodeJs {
  constructor() {
    this.socket = {};
  }

  createSocket(ip) {
    return this.setSocket(new WebSocket('ws://'+ip+':'+Config.WS_PORT));
  }

  setSocket(socket) {
    this.socket = socket;

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }
}

export default (new WebSocketNodeJs);