import React, { Component } from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import SeedWordsList from './SeedWordsList';
import SeedWordsSplash from './SeedWordsSplash';
import Pin from 'components/Pin';
import { getKey } from 'components/Pin/utils';
import NavigatorService from 'lib/navigator';


export default class SeedWords extends Component {
  static propTypes = {};

  state = {
    pin: null,
    pinSuccess: false,
    page: 0
  }

  componentDidMount() {
    getKey().then(pin => this.setState({pin}));
  }

  increment = () => this.setState({page: this.state.page + 1})
  decrement = () => this.setState({page: this.state.page - 1})

  onPinSuccess = () => this.setState({pinSuccess: true});

  toSettings = () => NavigatorService.navigate('Settings')

  render() {
    const { page, pin, pinSuccess } = this.state;

    if (page === 0) {
      return <SeedWordsSplash increment={this.increment}/>;
    }

    if (pin && !pinSuccess) {
      return (
        <Pin
          handleSuccess={this.onPinSuccess}
        />
      );
    }

    if (page === 1) {
      return (
        <SeedWordsList
          key="a"
          start={0}
          end={6}
          navigation={this.props.navigation}
          saveAndContinue={this.increment}
          goBack={this.toSettings}
        />
      );
    }

    if (page === 2) {
      return (
        <SeedWordsList
          key="b"
          navigation={this.props.navigation}
          start={6}
          end={12}
          saveAndContinue={this.toSettings}
          goBack={this.decrement}
        />
      );
    }

    return null;
  }
}

const styles = StyleSheet.create({
});
