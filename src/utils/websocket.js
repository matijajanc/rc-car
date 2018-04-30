import Config from 'react-native-config';

/**
 * Responsible for communicating with websockets
 * Singleton pattern
 */
class WebSocketNodeJs {
  constructor() {
    this.socket = {};
  }

  /**
   * Creates websocket instance
   *
   * @param ip
   * @returns {*}
   */
  createSocket(ip) {
    return this.set(new WebSocket('ws://'+ip+':'+Config.WS_PORT));
  }

  /**
   * Set websocket instance
   *
   * @param socket
   * @returns {*}
   */
  set(socket) {
    this.socket = socket;

    return this.socket;
  }

  /**
   * Get websocket instance
   *
   * @returns {*}
   */
  get() {
    return this.socket;
  }
}

export default (new WebSocketNodeJs);