import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Orientation from 'react-native-orientation-locker';
import Config from 'react-native-config';
import { createSocket } from '../../utils/websocket';
import { start as startKeepAlive } from '../../utils/keep-alive';
import { sendAll } from '../../utils/settings';
import { receive } from '../../utils/receiver';
import { vibrate } from '../../utils/vibrate';
import Container from '../Common/Container/ContainerComponent';
import Connection from './components/Connection';
import type { ConnectionStatus } from './components/Connection';
import type { RootStackParamList } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// A WebSocket to an unreachable host can hang; give up after this long.
const CONNECT_TIMEOUT_MS = 6000;

export default function ConnectionContainer(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const [domain, setDomain] = useState<string>(Config.WS_SERVER_IP ?? '');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Orientation.lockToPortrait();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const goHome = (): void => {
    setStatus('idle');
    navigation.navigate('Home');
  };

  const connect = (): void => {
    const ip = domain.trim();
    if (!ip || status === 'connecting') {
      return;
    }
    setStatus('connecting');
    vibrate();

    // A malformed address can make the WebSocket constructor throw — never let
    // that crash the app.
    let socket: WebSocket;
    try {
      socket = createSocket(ip);
    } catch {
      setStatus('error');
      return;
    }

    let settled = false;
    const finish = (ok: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (ok) {
        startKeepAlive();
        void sendAll();
        receive();
        goHome();
      } else {
        socket.close();
        setStatus('error');
      }
    };

    timeoutRef.current = setTimeout(() => finish(false), CONNECT_TIMEOUT_MS);
    socket.onopen = () => finish(true);
    socket.onerror = () => finish(false);
  };

  return (
    <Container>
      <Connection
        domain={domain}
        status={status}
        onChangeDomain={setDomain}
        onConnect={connect}
        onSkip={goHome}
      />
    </Container>
  );
}
