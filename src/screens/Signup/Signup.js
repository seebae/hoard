import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Try } from 'components/Conditional';

import { Layout, Body, Header, Footer } from 'components/Base';
import { colors } from 'styles';
import Input from 'components/Input';
import Button from 'components/Button';
import T from 'components/Typography';

const LANG_SIGN_UP_TEXT = 'Next';

export default class Signup extends Component {
  static propTypes = {
    navigation: PropTypes.any,
    signupRequest: PropTypes.func.isRequired,
  };

  state = {
    answers: {
      username: '',
      email_address: '',
      password: '',
      passwordConfirmation: '',
    },
    errors: {
      username: '',
      email_address: '',
      password: '',
      passwordConfirmation: ''
    },
    errorMessage: '',
    showErrors: false,
    showPasswordsMatch: false,
    loading: false,
    loggedIn: false,
  };

  static getDerivedStateFromProps(props, state) {
    if (state.loading && !props.signup.requesting && !props.signup.successful) {
      return {
        loading: false,
        errorMessage: props.signup.error
      };
    }
    return null;
  }

  handleLogInButton = () => {
    this.props.navigation.navigate('Login');
  };

  handleFormSubmit = () => {
    const { answers, errors } = this.state;

    if (_.find(errors)) {
      return this.setState({
        showErrors: true
      });
    }

    const userSignupData = {
      first_name: '',
      last_name: '',
      phone_number: '',
      email_address: answers.email_address,
      username: answers.username,
      password: answers.password,
    };

    this.setState({ loading: true }, () =>
      this.props.signupRequest(userSignupData)
    );
  };

  updateFormField = fieldName => text => {
    const answers = {
      ...this.state.answers,
      [fieldName]: text
    };

    this.setState({
      answers,
      errors: this.validate(answers),
      showPasswordsMatch: this.state.showPasswordsMatch || fieldName === 'passwordConfirmation'
    });
  };

  validate = (answers) => {
    return {
      username:
        !answers.username && 'Username is required'
        || answers.username.match(/[^\w]/) && 'Username may only include numbers, letters, and _'
        || (answers.username.length > 18 || answers.username.length < 3)
          && 'Username must be between 3 and 18 characters'
        || '',
      email_address:
        !answers.email_address && 'Email is required'
        || !answers.email_address.match(/^[a-zA-Z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$/)
          && 'Must be a valid email'
        || '',
      password:
        !answers.password && 'Password is required'
        || answers.password !== answers.passwordConfirmation
        || '',
      passwordConfirmation:
        !answers.passwordConfirmation && 'Password confirmation is required'
        || answers.password !== answers.passwordConfirmation
          && 'Your passwords do not match'
        || ''
    };
  };

  safeFocus = element => _.invoke(element, 'inputRef.focus');

  render() {
    const { answers, errors, showErrors, showPasswordsMatch } = this.state;

    const nextEnabled =
      answers.email_address &&
      answers.username &&
      answers.password &&
      answers.password === answers.passwordConfirmation;
    const placeholderTextColor = 'rgba(255,255,255,0.75)';

    return (
      <Layout preload={false} keyboard>
        <Body scrollable style={styles.body}>
          <Header>
            <T.Heading style={styles.headingText}>Your Information</T.Heading>
            <T.SubHeading style={styles.subHeadingText}>
              Enter your personal information
            </T.SubHeading>
          </Header>
          <Body>
            <Try condition={!!this.state.errorMessage}>
              <View style={styles.errorMessageContainer}>
                <T.Light style={styles.errorMessage}>{this.state.errorMessage}</T.Light>
              </View>
            </Try>
            <Input
              ref={el => (this.signupEmailAddressInput = el)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!this.state.loading}
              placeholder="you@email.com"
              placeholderTextColor={placeholderTextColor}
              returnKeyType="next"
              keyboardType="email-address"
              onSubmitEditing={() => this.safeFocus(this.signupUsernameInput)}
              onChangeText={this.updateFormField('email_address')}
              value={answers.email_address}
              error={showErrors && errors.email_address}
              type="underline"
              style={styles.input}
            />
            <Input
              ref={el => (this.signupUsernameInput = el)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!this.state.loading}
              placeholder="Username"
              placeholderTextColor={placeholderTextColor}
              returnKeyType="next"
              onSubmitEditing={() => this.safeFocus(this.signupPasswordInput)}
              onChangeText={this.updateFormField('username')}
              value={answers.username}
              error={showErrors && errors.username}
              type="underline"
              style={styles.input}
            />
            <Input
              ref={el => (this.signupPasswordInput = el)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!this.state.loading}
              placeholder="Password"
              placeholderTextColor={placeholderTextColor}
              returnKeyType="go"
              secureTextEntry
              onSubmitEditing={() =>
                this.safeFocus(this.signupPasswordConfirmationInput)
              }
              onChangeText={this.updateFormField('password')}
              value={answers.password}
              error={showErrors && errors.password}
              type="underline"
              style={styles.input}
            />
            <Input
              style={
                (showErrors || showPasswordsMatch) && !errors.passwordConfirmation
                  ? styles.inputSuccess
                  : {}
              }
              ref={el => (this.signupPasswordConfirmationInput = el)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!this.state.loading}
              placeholder="Re-enter Password"
              placeholderTextColor={placeholderTextColor}
              returnKeyType="go"
              secureTextEntry
              onSubmitEditing={this.handleFormSubmit}
              onChangeText={this.updateFormField('passwordConfirmation')}
              value={answers.passwordConfirmation}
              error={(showErrors || showPasswordsMatch) && errors.passwordConfirmation}
              type="underline"
            />
          </Body>
          <Footer>
            <Button
              type="primary"
              onPress={this.handleFormSubmit}
              loading={this.state.loading}
              disabled={!nextEnabled}
            >
              {LANG_SIGN_UP_TEXT}
            </Button>
            <TouchableOpacity
              style={styles.buttonContainerAlt}
              onPress={this.handleLogInButton}
            >
              <Text style={styles.buttonTextAlt}>
                Already have an account? Log In!
              </Text>
            </TouchableOpacity>
          </Footer>
        </Body>
      </Layout>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
  },

  image: {
    width: null,
    height: null,
    resizeMode: 'cover',
  },
  errorMessageContainer: {
    backgroundColor: '#ff6161',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    margin: 20,
  },
  errorMessage: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  input: {
    marginBottom: 15,
  },
  inputSuccess: {
    borderBottomColor: 'green',
  },
  inputError: {
    borderBottomColor: 'red',
  },
  inputErrorText: {
    color: colors.error,
  },
  buttonContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#223252',
    fontWeight: '700',
  },
  buttonContainerAlt: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    marginTop: 20,
  },
  buttonTextAlt: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
  },
  headingText: {
    color: colors.white,
    marginTop: 25,
    marginBottom: 25,
  },
  subHeadingText: {
    color: colors.white,
    marginBottom: 15,
  },
});
