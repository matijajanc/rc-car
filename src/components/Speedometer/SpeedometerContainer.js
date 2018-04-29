import React, {Component} from 'react';
import { EventRegister } from 'react-native-event-listeners';
import Speedometer from './components/Speedometer';

export default class SpeedometerContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      speed: 0
    };
  }

  componentWillMount() {
    this.listener = EventRegister.addEventListener('wsReceive', (data) => {
      if (data.option === 'sp') {
        this.setState({
          speed: data.value
        });
      }
    });
  }

  componentWillUnmount() {
    EventRegister.removeEventListener(this.listener);
  }

  navigate(value) {
    this.props.navigate(value);
  }

  render() {
    return <Speedometer speed={this.state.speed} navigate={(value) => this.navigate(value)} />
  }
}