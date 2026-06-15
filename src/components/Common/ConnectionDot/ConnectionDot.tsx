import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventRegister } from 'react-native-event-listeners';
import { colors } from '../../../config/styles/colors';
import { WS_STATUS_EVENT, getStatus } from '../../../utils/websocket';
import type { WsStatus } from '../../../utils/websocket';
import { navigationRef } from '../../../navigation/navigationRef';

// idle = not connected yet / opened offline; connecting = attempting;
// connected = server reachable; disconnected = failed or dropped.
const DOT_COLOR: Record<WsStatus, string> = {
  idle: '#777',
  connecting: colors.orange,
  connected: colors.green,
  disconnected: colors.red,
};

/**
 * Tiny always-on connection indicator, overlaid top-left across all screens.
 * Tap it to open the connection log (Diagnostics).
 */
export default function ConnectionDot(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<WsStatus>(getStatus());

  useEffect(() => {
    const sub = EventRegister.addEventListener(WS_STATUS_EVENT, (s: WsStatus) => setStatus(s));
    return () => {
      EventRegister.removeEventListener(sub as string);
    };
  }, []);

  const openDiagnostics = (): void => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Diagnostics');
    }
  };

  return (
    <Pressable
      onPress={openDiagnostics}
      hitSlop={12}
      // Top-right corner so it never collides with the back button / titles
      // that sit at the top-left of every screen.
      style={[styles.dot, { top: insets.top + 12, backgroundColor: DOT_COLOR[status] }]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    right: 16,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
