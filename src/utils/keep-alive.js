import Transmitter from "./transmitter";

class KeepAlive {
  start() {
    setInterval(function () {
      Transmitter.send('kp');
      console.log("KP!!!");
    }, 100);
  }
}

export default (new KeepAlive);