import Transmitter from "./transmitter";
import { END_CHAR } from '../config/config';

class KeepAlive {
  start() {
    setInterval(function () {
      Transmitter.send('kp' + END_CHAR);
    }, 100);
  }
}

export default (new KeepAlive);