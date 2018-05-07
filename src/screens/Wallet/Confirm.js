import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import Button from 'components/Button';

const TRANSACTION_URL = 'https://erebor.hoardinvest.com/transactions/confirm'

export async function makeTransactionRequest(url, queries) {
  return api.get(`${url}${makeQueryString(queries)}`);
}

export default class MyComponent extends Component {

  handleRequest = async (confirm) => {
    return `{success: ${confirm}}`;
    try {
      const json = await makeTransactionRequest(TRANSACTION_URL, `confirm=${confirm}`);
      if (json.success) {
        // TODO: handle success
      }
    } catch (error) {
      if (__DEV__) {
        console.log('error! ', error); // eslint-disable-line no-console
      }
    }
  };

  confirmTransaction = () => {
    this.handleRequest(true).then((response)=> alert('Handle Approve', response));

  }

  denyTransaction = () => {
    this.handleRequest(false).then((response)=> alert('Handle Reject',  response ) );
  }

  render() {

    return (
      <View
        style={styles.container}
      >
        <Text style={styles.header}>Continue transaction?</Text>
        <Text style={styles.header}>Send to: {this.props.navigation.state.params.uid || 'Unknown User'}</Text>
        <Text style={styles.header}>Transaction ID: {this.props.navigation.state.params.tx || 'Unknown Transaction'}</Text>
        <Text style={styles.text}>Your contact is now online. Would you like to continue and broadcast this transaction?</Text>
        <Button
          onPress={this.confirmTransaction}
          type="primary"
        >
          Yes, continue this transaction.
        </Button>
        <Button
          onPress={this.denyTransaction}
          type="secondary"
        >
          No, cancel this transaction.
        </Button>

      </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
  },
  xButton: {
    alignSelf: 'flex-end',
    fontSize: 30,
    fontWeight: '100',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  header: {
    fontSize: 25,
    fontWeight: '900',
    color: '#000',
  },
  actionButtons: {
    width: '100%',
    marginTop: 'auto',
    alignItems: 'center'
  },
  done: {
    width: '100%',
    alignItems: 'center',
    borderColor: 'grey',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'solid',
    borderRadius: 30,
    padding: 20
  },
  cancel: {
    padding: 20
  }
});
