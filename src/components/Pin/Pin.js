import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, Text, View, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import T from 'components/Typography';
import InputList from './InputList';
import Keyboard from './Keyboard';
import { validateKey } from './utils';

const LANG_ENTER_STRING = 'Please enter your PIN.';
const LANG_SUCCESS_STRING = 'Your PIN was entered successfully!.';

export default class Pin extends Component {
  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    handleSuccess: PropTypes.func,
  };

  maxRetries = 5;
  handleInputRef = ref => (this.inputEl = ref);

  shake = () => this.inputEl.shake(800);

  state = {
    pinValue: '',
    valid: false,
    attempts: 0,
  };

  validatePin = async value => {
    const valid = await validateKey(value);

    if (valid) {
      this.setState({ valid: true, pinValue: '', attempts: 0 });
      this.props.handleSuccess();
    } else {
      this.shake();
      this.setState({
        valid: false,
        pinValue: '',
        attempts: this.state.attempts + 1,
      });
    }
  };

  handlePinPress = value => {
    if (value === 'DEL') {
      const pin = this.state.pinValue.slice(0, -1);
      this.setState({ pinValue: pin });
      return;
    }

    const newPin = `${this.state.pinValue}${value}`;
    if (newPin.length >= 6) {
      this.validatePin(newPin);
    } else {
      this.setState({ pinValue: newPin });
    }
  };

  render() {
    const title = this.props.title || LANG_ENTER_STRING;
    const subtitle = this.props.subtitle || `Attempts: ${this.state.attempts}`;
    if (this.state.attempts >= this.maxRetries) {
      return (
        <View style={styles.container}>
          <View style={styles.pinView}>
            <Animatable.Text animation="fadeInUp" style={styles.pinPromptText}>
              Too Many Attempts
            </Animatable.Text>
          </View>
        </View>
      );
    } else {
      return (
        <Animatable.View animation="fadeInUp" style={styles.container}>
          <View style={{justifyContent: 'center', alignItems: 'center', padding: 20}}>
            <Image
              style={{
                height: 100,
                width: 100,
              }}
              resizeMode="contain"
              source={require('assets/pin-shield.png')}
            />
          </View>
          <View style={styles.pinView}>
            <T.Heading style={styles.text}>
              {this.state.valid ? '' : title}
              {this.state.pin && this.state.valid && LANG_SUCCESS_STRING}
            </T.Heading>
            <T.Light style={styles.pinPromptText}>
              {subtitle}
            </T.Light>
            <Animatable.View ref={this.handleInputRef}>
              <InputList pinLength={6} pinValue={this.state.pinValue} />
            </Animatable.View>
          </View>
          <Keyboard handlePinPress={this.handlePinPress} />
        </Animatable.View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    color: 'white',
  },
  pinView: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  pinKeyboard: {
    flex: -1,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pinKey: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '33.33%',
    height: 70,
    borderWidth: 1,
    borderColor: 'rgb(239, 239, 244)',
    flexGrow: 1,
    paddingTop: 8,
  },
  pinKeyEmpty: {
    backgroundColor: 'rgb(239, 239, 244)',
  },
  pinPromptText: {
    textAlign: 'center',
    color: 'white',
    marginVertical: 10,
  },
});
