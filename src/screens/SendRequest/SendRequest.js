import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Validator from 'wallet-address-validator';
import Config from 'react-native-config';
import { Alert, Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import memoize from 'lodash/memoize';

import { colors } from 'styles';
import Scene from 'components/Scene';
import T from 'components/Typography';
import UnderlineInput from 'components/UnderlineInput';
import LoadingSpinner from 'components/LoadingSpinner';
import Button from 'components/Button';
import SelectableImageHeader from 'components/SelectableImageHeader';
import { getCoinMetadata } from 'lib/currency-metadata';
import { formatDecimalInput } from 'lib/formatters';
import Conditional, { Try, Otherwise } from 'components/Conditional';
import {
  TYPE_SEND,
  TYPE_REQUEST,
  RECIPIENT_TYPE_ADDRESS,
  RECIPIENT_TYPE_OTHER,
} from 'screens/SendRequest/constants';
import Icon from 'components/Icon';
import NavigatorService from 'lib/navigator';
import api from 'lib/api';

import { convertCurrency, SOLVE_FOR } from 'lib/currency-helpers';

const amountFormatter = formatDecimalInput(8);

const initialState = {
  amount: '',
  fiat: '',
  recipient: '',
  recipientType: RECIPIENT_TYPE_ADDRESS,
  selectedId: null,
};

export default class SendRequest extends Component {
  static propTypes = {
    navigation: PropTypes.shape({
      state: PropTypes.shape({
        params: PropTypes.shape({
          type: PropTypes.oneOf([TYPE_SEND, TYPE_REQUEST]),
          wallet: PropTypes.string,
        }),
      }),
    }),
    wallets: PropTypes.arrayOf(
      PropTypes.shape({
        balance: PropTypes.number.isRequired,
        id: PropTypes.string.isRequired,
        symbol: PropTypes.string.isRequired,
      })
    ).isRequired,
    prices: PropTypes.objectOf(PropTypes.number),
    tradingPair: PropTypes.string,
    emailAddress: PropTypes.string,
    isSignedIn: PropTypes.bool.isRequired,
    getCurrencyPrice: PropTypes.func.isRequired,
    sendFunds: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    const selectedId =
      props.navigation.state &&
      props.navigation.state.params &&
      props.navigation.state.params.wallet;

    const transactionType =
      this.props.navigation.state.params &&
      this.props.navigation.state.params.type;

    let completionAction = () => {};
    if (transactionType === TYPE_SEND) {
      completionAction = this.send;
    } else if (transactionType === TYPE_REQUEST) {
      completionAction = this.request;
    }

    this.state = {
      ...initialState,
      transactionType,
      completionAction,
      recipientType:
        transactionType === TYPE_SEND
          ? RECIPIENT_TYPE_ADDRESS
          : RECIPIENT_TYPE_OTHER,
      selectedId: selectedId ? selectedId : initialState.selectedId,
    };
  }

  componentDidMount() {
    this.fetchPrice();
  }

  fetchPrice = () => {
    const selectedWallet = this.props.wallets.find(
      wallet => wallet.id === this.state.selectedId
    );

    if (selectedWallet) {
      this.props.getCurrencyPrice(selectedWallet.symbol);
    }
  };

  handleChangeAmount = value => {
    const selectedWallet = this.props.wallets.find(
      wallet => wallet.id === this.state.selectedId
    );

    const { destination } = convertCurrency({
      source: {
        pair: this.props.tradingPair,
        price: this.props.prices[selectedWallet.symbol],
        amount: Number(value),
      },
      destination: {
        pair: this.props.tradingPair,
        price: 1,
        amount: SOLVE_FOR,
      },
    });

    this.setState({
      fiat: amountFormatter(destination.amount),
      amount: amountFormatter(value),
    });
  };

  handleChangeFiat = value => {
    const selectedWallet = this.props.wallets.find(
      wallet => wallet.id === this.state.selectedId
    );

    const { destination } = convertCurrency({
      source: {
        pair: this.props.tradingPair,
        price: 1,
        amount: Number(value),
      },
      destination: {
        pair: this.props.tradingPair,
        price: this.props.prices[selectedWallet.symbol],
        amount: SOLVE_FOR,
      },
    });

    this.setState({
      fiat: amountFormatter(value),
      amount: amountFormatter(destination.amount),
    });
  };

  handleOnPressRecipient = () => NavigatorService.navigate('RecipientSelection', {
    transactionType: this.state.transactionType,
    isSignedIn: this.props.isSignedIn,
    onChangeRecipient: this.handleChangeRecipient
  });

  handleChangeRecipient = ({recipientType, recipient}) => this.setState({recipientType, recipient});

  handleOnPressCurrency = () => NavigatorService.navigate('CurrencyModal', {
    onChangeCurrency: this.handleChangeCurrency,
    selectedId: this.state.selectedId,
  });

  handleChangeCurrency = value =>
    this.setState(
      {
        amount: '',
        fiat: '',
        selectedId: value
      },
      this.fetchPrice
    );


  validate({ amount, selectedId, recipient, recipientType, transactionType}) {
    let verb;
    if (transactionType == TYPE_SEND) verb = 'send';
    if (transactionType == TYPE_REQUEST) verb = 'request';

    const numAmount = Number(amount);
    const selectedWallet = this.props.wallets.find(
      wallet => wallet.id === selectedId
    );
    if (!selectedId) {
      let preposition;
      let noun;
      if (transactionType == TYPE_SEND) {
        noun = 'wallet';
        preposition = 'from';
      }
      if (transactionType == TYPE_REQUEST) {
        noun = 'coin';
        preposition = 'with';
      }

      Alert.alert(`Please select a ${noun} to ${verb} ${preposition}`);
      return false;
    } else if (!numAmount) {
      Alert.alert(`Please input an amount to ${verb}`);
      return false;
    } else if (transactionType === TYPE_SEND && numAmount > selectedWallet.balance) {
      Alert.alert('You cannot send more than you have in your wallet');
      return false;
    } else if (recipientType === RECIPIENT_TYPE_ADDRESS && !recipient) {
      Alert.alert('Please an address to send to');
      return false;
    } else if (
      recipientType === RECIPIENT_TYPE_ADDRESS &&
      !Validator.validate(recipient, selectedWallet.symbol, Config.CURRENCY_NETWORK_TYPE === 'main' ? 'prod' : 'testnet')
    ) {
      Alert.alert(`This is not a valid ${selectedWallet.symbol} address`);
      return false;
    } else if (recipientType === RECIPIENT_TYPE_OTHER && !recipient) {
      let preposition;
      if (transactionType == TYPE_SEND) preposition = 'to';
      if (transactionType == TYPE_REQUEST) preposition = 'from';

      Alert.alert(`Please enter a contact to ${verb} ${preposition}`);
      return false;
    } else {
      return true;
    }
  }

  send = async () => {
    if (this.validate(this.state)) {
      let recipient;
      const selectedWallet = this.props.wallets.find(
        wallet => wallet.id === this.state.selectedId
      );
      if (this.state.recipientType === RECIPIENT_TYPE_ADDRESS) {
        recipient = this.state.recipient;
      } else {
        try {
          const response = await api.post(
            'https://erebor-staging.hoardinvest.com/contacts/transaction',
            {
              sender: selectedWallet.publicAddress,
              amount: Number(this.state.amount),
              recipient: this.state.recipient,
              currency: selectedWallet.symbol,
            }
          );

          if (response.success) {
            Alert.alert(
              `This user does not use Hoard,
  but has been notified that you
  have attempted to send them some funds!`
            );
          } else {
            recipient = response.public_key;
          }
        } catch (e) {
          Alert.alert(
            `Oops! ${e.message}: ${e.errors &&
              e.errors[0] &&
              e.errors[0].message}`
          );
        }
      }

      if (recipient) {
        const action = this.props.sendFunds(
          this.state.selectedId,
          recipient,
          Number(this.state.amount)
        );

        NavigatorService.navigate('TransactionStatus', {
          id: action.id,
          type: TYPE_SEND,
        });
      }
    }
  };

  request = async () => {
    if (this.validate(this.state)) {
      const selectedWallet = this.props.wallets.find(
        wallet => wallet.id === this.state.selectedId
      );
      try {
        await api.post('https://erebor-staging.hoardinvest.com/request_funds', {
          email_address: this.props.emailAddress,
          amount: Number(this.state.amount),
          recipient: this.state.recipient,
          currency: selectedWallet.symbol,
        });

        Alert.alert(
          'This user has been notified that you have requested funds from them!'
        );
      } catch (e) {
        Alert.alert(
          `Oops! ${e.message}: ${e.errors &&
            e.errors[0] &&
            e.errors[0].message}`
        );
      }
    }
  };

  clearValue = memoize(stateKey => () => {
    this.setState({ [stateKey]: '' });
  });

  render() {
    const { wallets, prices } = this.props;
    const { amount, fiat, selectedId } = this.state;

    const selectedWallet = wallets.find(wallet => wallet.id === selectedId);
    const isLoadingPrice = !prices[selectedWallet.symbol];

    const currencyDisplay = selectedWallet && {
      title: getCoinMetadata(selectedWallet.symbol).fullName,
      subtitle: selectedWallet.balance,
      image: getCoinMetadata(selectedWallet.symbol).image,
    };

    let title = '';
    let recipientEmptyText = '';
    if (this.state.transactionType === TYPE_SEND) {
      title = 'SEND';
      recipientEmptyText = 'Recipient';
    } else if (this.state.transactionType === TYPE_REQUEST) {
      title = 'Request';
      recipientEmptyText = 'Requesting From';
    }

    return (
      <Scene preload={false}>
        <View style={styles.flex1}>
          <Conditional>
            <Try condition={isLoadingPrice}>
              <View style={styles.flex1}>
                <View style={styles.loading}>
                  <T.GrayedOut>Loading Prices...</T.GrayedOut>
                </View>
                <LoadingSpinner />
              </View>
            </Try>
            <Try condition={!wallets.length}>
              <T.GrayedOut>You have not yet created any wallets</T.GrayedOut>
            </Try>
            <Otherwise>
              <View style={[styles.flex1, styles.contentContainer]}>
                <T.Heading style={styles.subheading}>{title}</T.Heading>
                <View>
                  <TouchableOpacity onPress={this.handleOnPressRecipient}>
                    <View style={styles.recipientContainer}>
                      <Conditional>
                        <Try condition={!!this.state.recipient}>
                          <T.Light style={styles.recipientHeader}>
                            Recipient
                          </T.Light>
                        </Try>
                        <Otherwise>
                          <View style={{height: 22}}/>
                        </Otherwise>
                      </Conditional>
                      <View style={styles.recipientContent}>
                        <T.Light style={styles.recipientText}>
                          {this.state.recipient || recipientEmptyText}
                        </T.Light>
                        <Conditional>
                          <Try condition={!!this.state.recipient}>
                            <TouchableOpacity
                              style={styles.action}
                              onPress={this.clearValue('recipient')}
                            >
                              <Icon icon="ios-close-circle" style={{ size: 20, color: 'rgba(255,255,255,0.5)' }} />
                            </TouchableOpacity>
                          </Try>
                          <Otherwise>
                            <Image style={styles.recipientChevron} source={require('assets/chevron.png')} />
                          </Otherwise>
                        </Conditional>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                <SelectableImageHeader
                  title="Currency"
                  emptyText="Select Currency"
                  selection={currencyDisplay}
                  onPress={this.handleOnPressCurrency}
                />
                <View style={styles.valueInputs}>
                  <View style={styles.amount}>
                    <UnderlineInput
                      style={styles.input}
                      keyboardType="numeric"
                      label={
                        selectedWallet
                          ? `Enter ${selectedWallet.symbol}`
                          : 'Enter Amount'
                      }
                      onChangeText={this.handleChangeAmount}
                      value={amount.toString()}
                    />
                  </View>
                  <View style={styles.fiat}>
                    <UnderlineInput
                      style={styles.input}
                      keyboardType="numeric"
                      label={`Enter ${this.props.tradingPair}`}
                      onChangeText={this.handleChangeFiat}
                      value={fiat}
                    />
                  </View>
                </View>
                <Button
                  disabled={!selectedId}
                  onPress={this.state.completionAction}
                >
                  {title}
                </Button>
              </View>
            </Otherwise>
          </Conditional>
        </View>
      </Scene>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    marginVertical: 20,
  },
  input: {},
  recipientContainer: {
    paddingVertical: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  recipientHeader: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 5,
  },
  recipientContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipientText: {
    color: 'white',
  },
  recipientChevron: {
    resizeMode: 'contain',
    height: 14,
    width: 14,
  },
  action: {
    marginBottom: -10,
  },
  button: {
    flex: 1,
    margin: 20,
  },
  flex1: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  subheading: {
    justifyContent: 'center',
    color: colors.white,
    marginBottom: 20,
  },
  subheadingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  changeCoin: {
    alignItems: 'center',
  },
  coinImage: {
    height: 30,
    width: 30,
    borderRadius: 15,
    margin: 10,
    resizeMode: 'cover',
  },
  valueInputs: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 20,
  },
  amount: {
    flex: 1,
    marginRight: 10,
  },
  fiat: {
    flex: 1,
    marginLeft: 10,
  },
});
