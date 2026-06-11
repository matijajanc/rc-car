import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Orientation from 'react-native-orientation-locker';
import { send } from '../../utils/transmitter';
import { vibrate } from '../../utils/vibrate';
import Container from '../Common/Container/ContainerComponent';
import DriveModeButtons from './components/DriveModeButtons';
import type { RootStackParamList } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DriveModeButtonsContainer(): React.JSX.Element {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.lockToPortrait();
  }, []);

  const buttonPress = (command: string): void => {
    send(command);
    vibrate();
  };

  const buttonRelease = (command: string): void => {
    send(command);
  };

  return (
    <Container>
      <DriveModeButtons
        callbackBtnPress={buttonPress}
        callbackBtnRelease={buttonRelease}
        navigate={(route: string) => navigation.navigate(route as never)}
      />
    </Container>
  );
}
