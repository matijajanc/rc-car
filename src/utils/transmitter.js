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

// INCOMING DATA (ARDUINO DATA)
// mt -> motor temperature
// sp -> car speed
// bv -> battery voltage
// rs -> range sensor problem

import { END_CHAR } from '../config/config';
import WebSocketNodeJs from './websocket';

export default class Transmitter {
  static send(command) {
    const socket = WebSocketNodeJs.get();
    socket.send(command + END_CHAR);

    console.log(command + END_CHAR);
  }
}
