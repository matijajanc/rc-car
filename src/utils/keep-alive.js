import Transmitter from "./transmitter";
import { END_CHAR } from '../config/config';

/**
 * Constantly sending a signal to RC car if something goes wrong
 * and car don't gets a signal 3 times in a row, stopCar
 * function gets executed on a car side and stops the car safely.
 */
class KeepAlive {
  start() {
    setInterval(function () {
      Transmitter.send('kp' + END_CHAR);
    }, 100);
  }
}

export default (new KeepAlive);