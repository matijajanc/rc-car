// Name Commands
// dm -> drive mode
// ad -> accelerometers drive
// ab -> accelerometers backward (drive)
// as -> accelerometers steer
// db -> drive buttons
// kp -> keep alive (connection)
// sc -> steer calibrate
// st -> stop the car on exit driveMode 2 (Accelerometers)
// sf -> speed factor

// ARDUINO OPTIONS
// rs -> range sensors
// rc -> range sensor servo angle
// cl -> car lights
// bl -> blinkers
// b4 -> all 4 blinkers
// cm -> camera
// ll -> long lights

import { END_CHAR } from '../config/config';
import WebSocketNodeJs from './websocket';

/**
 * The purpose of this class is for sending
 * all kind of data to RC car.
 */
export default class Transmitter {
  /**
   * Sends commands and adds an end character so that we
   * know on a car side when some command is finished.
   * We are splitting commands by this end character.
   *
   * @string command
   */
  static send(command) {
    const socket = WebSocketNodeJs.get();
    if (Object.keys(socket).length) {
      socket.send(command + END_CHAR);
      console.log(command + END_CHAR);  // For debugging
    }
  }
}
