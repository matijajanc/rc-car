import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventRegister } from 'react-native-event-listeners';
import Orientation from 'react-native-orientation-locker';
import Config from 'react-native-config';
import { WS_STATUS_EVENT, createSocket, getSocket } from '../../utils/websocket';
import type { WsStatus } from '../../utils/websocket';
import { start as startKeepAlive } from '../../utils/keep-alive';
import { start as startCarLink } from '../../utils/car-link';
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
  const attemptingRef = useRef(false);

  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  // Resolve a connect attempt off the global ws status emitted by websocket.ts.
  useEffect(() => {
    const clearTimer = (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    const sub = EventRegister.addEventListener(WS_STATUS_EVENT, (s: WsStatus) => {
      if (!attemptingRef.current) {
        return;
      }
      if (s === 'connected') {
        attemptingRef.current = false;
        clearTimer();
        startKeepAlive();
        startCarLink();
        void sendAll();
        receive();
        setStatus('idle');
        navigation.navigate('Home');
      } else if (s === 'disconnected') {
        attemptingRef.current = false;
        clearTimer();
        setStatus('error');
      }
    });
    return () => {
      EventRegister.removeEventListener(sub as string);
      clearTimer();
    };
  }, [navigation]);

  const connect = (): void => {
    const ip = domain.trim();
    if (!ip || attemptingRef.current) {
      return;
    }
    setStatus('connecting');
    attemptingRef.current = true;
    vibrate();

    // A malformed address can make the WebSocket constructor throw — never let
    // that crash the app.
    try {
      createSocket(ip);
    } catch {
      attemptingRef.current = false;
      setStatus('error');
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (!attemptingRef.current) {
        return;
      }
      attemptingRef.current = false;
      getSocket()?.close();
      setStatus('error');
    }, CONNECT_TIMEOUT_MS);
  };

  const goHome = (): void => {
    setStatus('idle');
    navigation.navigate('Home');
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
