import React from 'react';
import { Switch } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Transmitter from '../../../utils/transmitter';
import { colors } from '../../../config/styles/colors';

interface Props {
  /** Protocol command code; persisted under `setting-<code>` and sent on toggle. */
  setting: string;
  style?: StyleProp<ViewStyle>;
}

interface State {
  enabled: boolean;
}

/**
 * Persisted on/off switch. Restores its saved value from AsyncStorage on mount
 * and sends the new value to the car (`<code>1` / `<code>0`) on every toggle.
 */
export default class OnOffSetting extends React.Component<Props, State> {
  state: State = { enabled: false };

  componentDidMount(): void {
    // Restore the saved value for this setting.
    AsyncStorage.getItem(`setting-${this.props.setting}`).then((value) => {
      this.setState({ enabled: value === 'true' });
    });
  }

  private setSetting = (value: boolean): void => {
    this.setState({ enabled: value });
    Transmitter.send(this.props.setting + (value ? 1 : 0));
    AsyncStorage.setItem(`setting-${this.props.setting}`, value.toString());
  };

  render(): React.JSX.Element {
    return (
      <Switch
        style={this.props.style}
        value={this.state.enabled}
        onValueChange={this.setSetting}
        trackColor={{ false: colors.blue, true: colors.blue }}
        thumbColor={colors.switchThumbTintColor}
        ios_backgroundColor={colors.blue}
      />
    );
  }
}
