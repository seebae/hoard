import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Config from 'react-native-config';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import { Layout, Header, Body } from 'components/Base';
import { Try } from 'components/Conditional';
import Input from 'components/Input';
import Button from 'components/Button';
import NavigatorService from 'lib/navigator';
import withDismissableKeyboard from 'hocs/withDismissableKeyboard';
import api from 'lib/api';

const DismissableView = withDismissableKeyboard(View);

export default class CreateSupportTicket extends Component {
  static propTypes = {
    isSignedIn: PropTypes.bool,
    emailAddress: PropTypes.string,
  };

  state = {
    largeInputHeight: 40,
    loading: false,
    showErrors: false,
    answers: {
      email_address: '',
      name: '',
      subject: '',
      description: '',
    },
    errors: {
      email_address: false,
      name: false,
      subject: false,
      description: false,
    },
  };

  static getDerivedStateFromProps(props, state) {
    if (props.isSignedIn) {
      return {
        answers: {
          ...state.answers,
          email_address: props.emailAddress,
        },
      };
    }
    return null;
  }

  handleChange = type => value => {
    const answers = { ...this.state.answers, [type]: value };
    const errors = this.validate(answers);
    this.setState({ answers, errors });
  };

  measureLargeInput = ({ nativeEvent }) =>
    this.setState({ largeInputHeight: nativeEvent.layout.height - 80 });

  validate = ({ email_address, description, name }) => ({
    email_address:
      (!email_address && 'An email is required') ||
      (!email_address.match(/^[a-zA-Z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$/) &&
        'Must be a valid email'),
    description: !description && 'A description is required',
    name: !name && 'A name is required',
  });

  submit = async () => {
    Keyboard.dismiss();

    const { errors, answers } = this.state;
    if (errors.email_address || errors.subject || errors.description || errors.name) {
      return this.setState({ showErrors: true });
    }

    try {
      const response = await api.post(
        `${Config.EREBOR_ENDPOINT}/support`,
        answers
      );
      if (response.success) {
        Alert.alert(
          'Your ticket has been submitted successfully!',
          'A confirmation email should be sent soon',
          [
            {
              text: 'OK',
              onPress: () => NavigatorService.navigate('GetHelp'),
            },
          ]
        );
      } else {
        throw new Error('Unknown Error');
      }
    } catch (e) {
      Alert.alert(
        'An error occurred while submitting your ticket.',
        'Please try again, or email us directly at support@hoardinvest.com',
        [
          {
            text: 'OK',
            onPress: () => NavigatorService.navigate('GetHelp'),
          },
        ]
      );
    }
  };

  render() {
    return (
      <Layout keyboard>
        <Body style={styles.content} dismissKeyboard scrollable>
          <DismissableView style={styles.container}>
            <Try condition={!this.props.isSignedIn}>
              <Input
                placeholder="Enter Email *"
                keyboardType="email-address"
                returnKeyType="next"
                error={this.state.showErrors && this.state.errors.email_address}
                onChangeText={this.handleChange('email_address')}
                value={this.state.answers.email_address}
                type="underline"
              />
            </Try>
            <Input
              placeholder="Name"
              returnKeyType="next"
              error={this.state.showErrors && this.state.errors.name}
              onChangeText={this.handleChange('name')}
              value={this.state.answers.name}
              type="underline"
            />
            <Input
              placeholder="Subject"
              returnKeyType="next"
              error={this.state.showErrors && this.state.errors.subject}
              onChangeText={this.handleChange('subject')}
              value={this.state.answers.subject}
              type="underline"
            />
            <View onLayout={this.measureLargeInput} style={styles.largeInput}>
              <Input
                placeholder="Description *"
                multiline={true}
                onChangeText={this.handleChange('description')}
                value={this.state.answers.description}
                error={this.state.showErrors && this.state.errors.description}
                style={{ height: this.state.largeInputHeight }}
              />
            </View>
            <Button
              disabled={
                !this.state.answers.email_address ||
                !this.state.answers.description ||
                !this.state.answers.name
              }
              loading={this.state.loading}
              onPress={this.submit}
            >
              Submit
            </Button>
          </DismissableView>
        </Body>
      </Layout>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  largeInput: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingVertical: 40,
  },
});
