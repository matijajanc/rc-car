import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Orientation from 'react-native-orientation-locker';
import { send } from '../../utils/transmitter';
import { vibrate } from '../../utils/vibrate';
import {
  Channels,
  DEFAULT_CHANNELS,
  channelsToPosition,
  channelsToWire,
  parseChannels,
  positionToChannels,
} from '../../utils/underglow';
import Container from '../Common/Container/ContainerComponent';
import Underglow from './components/Underglow';

const STORAGE_KEY = 'setting-lc';

/**
 * Pick the colour of the bottom LED strip ("underglow"). The strip has only red
 * and blue channels, so the picker walks the blue→magenta→pink hue arc (see
 * src/utils/underglow.ts) and sends raw channel values as `lc<r>,<b>`. The
 * chosen colour is persisted under `setting-lc`, so settings.sendAll() replays
 * it to the car on every connect and the firmware paints it on each keep-alive.
 * Red is left to the firmware as the stop/brake alert.
 *
 * The slider position is the source of truth for the UI; channel values are
 * derived from it. That keeps the control jitter-free (the value we feed back
 * to the Slider is exactly what the user dragged, not a lossy round-trip).
 */
export default function UnderglowContainer(): React.JSX.Element {
  const [position, setPosition] = useState(channelsToPosition(DEFAULT_CHANNELS));
  // Last colour actually put on the wire, so a drag only sends when the rounded
  // channels move (the Slider fires onValueChange far faster than 256 steps).
  const lastSent = useRef<Channels>(DEFAULT_CHANNELS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const parsed = stored ? parseChannels(stored) : null;
      if (parsed) {
        setPosition(channelsToPosition(parsed));
        lastSent.current = parsed;
      }
    });
    Orientation.lockToPortrait();
  }, []);

  // Live preview while dragging: update the strip as the colour changes.
  const onChange = (next: number): void => {
    setPosition(next);
    const channels = positionToChannels(next);
    if (channels.r !== lastSent.current.r || channels.b !== lastSent.current.b) {
      lastSent.current = channels;
      send(`lc${channelsToWire(channels)}`);
    }
  };

  // Persist once the user lets go — one AsyncStorage write per drag, not per frame.
  const onComplete = (next: number): void => {
    void AsyncStorage.setItem(STORAGE_KEY, channelsToWire(positionToChannels(next)));
    vibrate();
  };

  return (
    <Container>
      <Underglow
        position={position}
        channels={positionToChannels(position)}
        onChange={onChange}
        onComplete={onComplete}
      />
    </Container>
  );
}
