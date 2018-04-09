import Transmitter from "./transmitter";

class KeepAlive {
  start() {
    setInterval(function () {
      Transmitter.send('kp');
    }, 100);
  }
}

export default (new KeepAlive);