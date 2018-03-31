import { END_CHAR } from '../config/config';

export default class Transmitter {
  send(command) {
    socket.send(command + END_CHAR);
  }
}
