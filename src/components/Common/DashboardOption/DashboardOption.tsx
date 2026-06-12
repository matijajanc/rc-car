import React from 'react';
import { TouchableHighlight } from 'react-native';
import Transmitter from '../../../utils/transmitter';

/** Props the returned component accepts. */
interface DashboardOptionProps {
  /** Protocol command code sent on toggle (e.g. 'cl', 'b4', 'll'). */
  command: string;
  /** Colour applied to the wrapped icon while the option is on. */
  selectedColor: string;
}

/** Prop injected into the wrapped presentational (SVG) component. */
interface InjectedProps {
  fillSvg: string;
}

interface State {
  on: boolean;
  color: string;
}

const DEFAULT_COLOR = '#fff';

/**
 * HOC: turns an SVG icon into a toggleable dashboard control. Tapping it flips
 * the fill colour and sends `<command>1` / `<command>0` to the car.
 */
export default function DashboardOption(
  Wrapped: React.ComponentType<InjectedProps>,
): React.ComponentType<DashboardOptionProps> {
  return class extends React.Component<DashboardOptionProps, State> {
    state: State = { on: false, color: DEFAULT_COLOR };

    private updateOption = (): void => {
      const next = !this.state.on;
      this.setState({
        on: next,
        color: next ? this.props.selectedColor : DEFAULT_COLOR,
      });
      Transmitter.send(this.props.command + (next ? 1 : 0));
    };

    render(): React.JSX.Element {
      return (
        <TouchableHighlight onPress={this.updateOption}>
          <Wrapped fillSvg={this.state.color} />
        </TouchableHighlight>
      );
    }
  };
}
