import React, { Component } from 'react';
import { AsyncStorage, StyleSheet } from 'react-native';
import SeedWordsList from './SeedWordsList';
import SeedWordsSplash from './SeedWordsSplash';
import Pin from 'components/Pin';
import { getKey } from 'components/Pin/utils';
import NavigatorService from 'lib/navigator';

const SEED_WORDS_ACCESS_TIME_KEY = 'SEED_WORDS_ACCESS_TIME';

export default class SeedWords extends Component {
  static propTypes = {};

  state = {
    pin: null,
    pinSuccess: false,
    lastDisplayTime: null,
    page: 0
  }

  componentDidMount() {
    getKey()
      .then(pin => this.setState({pin}));
    AsyncStorage.getItem(SEED_WORDS_ACCESS_TIME_KEY)
      .then(lastDisplayTime => this.setState({lastDisplayTime}));
  }

  increment = () => this.setState({page: this.state.page + 1})
  decrement = () => this.setState({page: this.state.page - 1})

  onPinSuccess = () => {
    const lastDisplayTime = Date.now();
    AsyncStorage.setItem(SEED_WORDS_ACCESS_TIME_KEY, lastDisplayTime.toString());
    this.setState({pinSuccess: true, lastDisplayTime});
  }

  toSettings = () => NavigatorService.navigate('Settings')

  render() {
    const { page, pin, pinSuccess, lastDisplayTime } = this.state;

    if (page === 0) {
      return <SeedWordsSplash onDisplay={this.increment} lastDisplayTime={lastDisplayTime}/>;
    }

    if (pin && !pinSuccess) {
      return (
        <Pin
          title="Input Pin"
          subtitle="Your PIN will be used to unlock and view your keys"
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
