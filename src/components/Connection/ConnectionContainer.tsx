import React, { useEffect, useState } from 'react';
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
import type { RootStackParamList } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ConnectionContainer(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const [domain, setDomain] = useState<string>(Config.WS_SERVER_IP ?? '');

  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  const connect = (): void => {
    if (!domain) {
      return;
    }
    const socket = createSocket(domain);
    socket.onopen = () => {
      startKeepAlive();
      void sendAll();
      receive();
      navigation.navigate('Home');
    };
    // Open the app without a server (replaces the legacy 10-tap fallback).
    socket.onerror = () => navigation.navigate('Home');
    vibrate();
  };

  return (
    <Container>
      <Connection callback={setDomain} domain={domain} connect={connect} />
    </Container>
  );
}
