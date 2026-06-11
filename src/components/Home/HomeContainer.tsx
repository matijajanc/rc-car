import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Orientation from 'react-native-orientation-locker';
import Container from '../Common/Container/ContainerComponent';
import Home from './components/Home';
import type { RootStackParamList } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeContainer(): React.JSX.Element {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  return (
    <Container>
      <Home navigate={(route: string) => navigation.navigate(route as never)} />
    </Container>
  );
}
