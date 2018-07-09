import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text, Image, StyleSheet } from 'react-native';
import WordList from 'screens/Wallet/Mnemonic/Generate/WordList';
import {Layout} from 'components/Base';
import Button from 'components/Button';

export default class SeedWordsSplash extends Component {
  static propTypes = {};

  render() {
    return (
      <Layout preload={false}>
        <Text>i am a splash page</Text>;
        <Button onPress={this.props.increment}>
          hey
        </Button>
      </Layout>
    );
  }
}

const styles = StyleSheet.create({
});

