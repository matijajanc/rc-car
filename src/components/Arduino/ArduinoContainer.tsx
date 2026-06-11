import React, { useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';
import Arduino from './components/Arduino';
import sectionListData from './data/sectionListData';

export default function ArduinoContainer(): React.JSX.Element {
  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  return <Arduino data={sectionListData} />;
}
