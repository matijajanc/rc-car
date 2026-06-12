import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventRegister } from 'react-native-event-listeners';
import { colors } from '../../../config/styles/colors';
import { WS_STATUS_EVENT, getStatus } from '../../../utils/websocket';
import type { WsStatus } from '../../../utils/websocket';

// idle = not connected yet / opened offline; connecting = attempting;
// connected = server reachable; disconnected = failed or dropped.
const DOT_COLOR: Record<WsStatus, string> = {
  idle: '#777',
  connecting: colors.orange,
  connected: colors.green,
  disconnected: colors.red,
};

/** Tiny always-on connection indicator, overlaid top-left across all screens. */
export default function ConnectionDot(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<WsStatus>(getStatus());

  useEffect(() => {
    const sub = EventRegister.addEventListener(WS_STATUS_EVENT, (s: WsStatus) =>
      setStatus(s),
    );
    return () => EventRegister.removeEventListener(sub as string);
  }, []);

  return (
    <View
      pointerEvents="none"
      style={[styles.dot, { top: insets.top + 10, backgroundColor: DOT_COLOR[status] }]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
});
