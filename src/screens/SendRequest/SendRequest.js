import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert, StyleSheet, View, TouchableOpacity, Image } from 'react-native';

import Config from 'react-native-config';
import { colors } from 'styles';
import Scene from 'components/Scene';
import T from 'components/Typography';
import UnderlineInput from 'components/UnderlineInput';
import LoadingSpinner from 'components/LoadingSpinner';
import Button from 'components/Button';
import CurrencySelection from './CurrencySelection';
import SelectableImageHeader from 'components/SelectableImageHeader';
import { getCoinMetadata } from 'lib/currency-metadata';
import { formatDecimalInput } from 'lib/formatters';
import Conditional, { Try, Otherwise } from 'components/Conditional';
import { TYPE_SEND, TYPE_REQUEST } from 'screens/SendRequest/constants';
import NavigatorService from 'lib/navigator';
import api from 'lib/api';

import { convertCurrency, SOLVE_FOR } from 'lib/currency-helpers';

const amountFormatter = formatDecimalInput(8);

const RECIPIENT_TYPE_ADDRESS = 'RECIPIENT_TYPE_ADDRESS';
const RECIPIENT_TYPE_OTHER = 'RECIPIENT_TYPE_OTHER';

const initialState = {
  amount: '',
  fiat: '',
  contact: '',
  recipientType: RECIPIENT_TYPE_ADDRESS,
  toAddress: '',
  selectedId: null,
  selectingWallet: false,
};

export default class SendRequest extends Component {
  static propTypes = {
    navigation: PropTypes.shape({
      setParams: PropTypes.func.isRequired,
      state: PropTypes.shape({
        params: PropTypes.shape({
          type: PropTypes.oneOf([TYPE_SEND, TYPE_REQUEST]),
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
    requestFunds: PropTypes.func.isRequired,
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
      canChangeRecipientType: transactionType === TYPE_SEND && props.isSignedIn,
      selectedId: selectedId ? selectedId : initialState.selectedId,
    };
  }

  componentDidMount() {
    this.fetchPrice();
    this.setNavigation();
  }

  setNavigation = () => {
    const headerProps = {};

    if (this.state.selectingWallet) {
      headerProps.title = 'Select Currency';
      headerProps.leftAction = (
        <TouchableOpacity onPress={this.toggleCoinSelector}>
          <Image source={require('assets/closeicon.png')} />
        </TouchableOpacity>
      );
    } else {
      headerProps.title = null; // reset and don't override title
      headerProps.leftAction = 'back';
      headerProps.rightAction = 'menu';
    }

    this.props.navigation.setParams(headerProps);
  };

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

  handleRecipientTypeSelection = recipientType => () =>
    this.setState({ recipientType });

  handleChangeToAddress = value => this.setState({ toAddress: value });

  handleChangeContact = value => this.setState({ contact: value });

  handleSelectCoin = value => () =>
    this.setState(
      {
        amount: '',
        fiat: '',
        toAddress: '',
        selectedId: value,
        selectingWallet: false,
      },
      () => {
        this.fetchPrice();
        this.setNavigation();
      }
    );

  toggleCoinSelector = () =>
    this.setState(
      { selectingWallet: !this.state.selectingWallet },
      this.setNavigation
    );

  validate({ amount, toAddress, selectedId, contact, recipientType }) {
    const numAmount = Number(amount);
    const selectedWallet = this.props.wallets.find(
      wallet => wallet.id === selectedId
    );
    if (!selectedId) {
      Alert.alert('Please select a wallet to send from');
      return false;
    } else if (!numAmount) {
      Alert.alert('Please input an amount to send');
      return false;
    } else if (numAmount > selectedWallet.balance) {
      Alert.alert('You cannot send more than you have in your wallet');
      return false;
    } else if (recipientType === RECIPIENT_TYPE_ADDRESS && !toAddress) {
      Alert.alert('Please an address to send to');
      return false;
    } else if (recipientType === RECIPIENT_TYPE_OTHER && !contact) {
      Alert.alert('Please enter a contact to send to');
      return false;
    } else {
      return true;
    }
  }

  send = async () => {
    if (this.validate(this.state)) {
      let toAddress;
      const selectedWallet = this.props.wallets.find(
        wallet => wallet.id === this.state.selectedId
      );
      if (this.state.recipientType === RECIPIENT_TYPE_ADDRESS) {
        toAddress = this.state.toAddress;
      } else {
        try {
          const response = await api.post(
            `${Config.EREBOR_ENDPOINT}/contacts/transaction`,
            {
              sender: selectedWallet.publicAddress,
              amount: Number(this.state.amount),
              recipient: this.state.contact,
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
            toAddress = response.public_key;
          }
        } catch (e) {
          Alert.alert(
            `Oops! ${e.message}: ${e.errors &&
              e.errors[0] &&
              e.errors[0].message}`
          );
        }
      }

      if (toAddress) {
        const action = this.props.sendFunds(
          this.state.selectedId,
          toAddress,
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
        await api.post(`${Config.EREBOR_ENDPOINT}/request_funds`, {
          email_address: this.props.emailAddress,
          amount: Number(this.state.amount),
          recipient: this.state.contact,
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

  renderRecipientType = recipientType => {
    if (recipientType === RECIPIENT_TYPE_ADDRESS) {
      return (
        <UnderlineInput
          style={styles.input}
          label="Address"
          onChangeText={this.handleChangeToAddress}
          value={this.state.toAddress}
        />
      );
    }

    if (recipientType === RECIPIENT_TYPE_OTHER) {
      return (
        <UnderlineInput
          style={styles.input}
          label="Phone Number, Email, or Username"
          onChangeText={this.handleChangeContact}
          value={this.state.contact}
        />
      );
    }

    return null;
  };

  render() {
    const { wallets, prices } = this.props;
    const { amount, fiat, selectedId, selectingWallet } = this.state;

    const selectedWallet = wallets.find(wallet => wallet.id === selectedId);
    const isLoadingPrice = !prices[selectedWallet.symbol];

    const walletTitle = selectedWallet
      ? `Sending ${getCoinMetadata(selectedWallet.symbol).fullName} ${
          selectedWallet.symbol
        }`
      : 'Select Currency';

    const currencyDisplay = selectedWallet && {
      title: getCoinMetadata(selectedWallet.symbol).fullName,
      subtitle: selectedWallet.balance,
      image: getCoinMetadata(selectedWallet.symbol).image,
    };

    let title = '';
    if (this.state.transactionType === TYPE_SEND) {
      title = 'SEND';
    } else if (this.state.transactionType === TYPE_REQUEST) {
      title = 'Request';
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
            <Try condition={selectingWallet}>
              <CurrencySelection
                title={walletTitle}
                items={wallets.map(wallet => {
                  const metadata = getCoinMetadata(wallet.symbol);

                  return {
                    image: metadata.image,
                    onPress: this.handleSelectCoin(wallet.id),
                    selected: selectedId === wallet.id,
                    subtitle: `${wallet.symbol}    ${wallet.balance}`,
                    title: metadata.fullName,
                  };
                })}
              />
            </Try>

            <Otherwise>
              <View style={[styles.flex1, styles.contentContainer]}>
                <T.Heading style={styles.subheading}>{title}</T.Heading>
                <View>
                  <View style={{ flexDirection: 'row' }}>
                    <Conditional>
                      <Try
                        condition={
                          this.state.canChangeRecipientType &&
                          this.state.recipientType === RECIPIENT_TYPE_ADDRESS
                        }
                      >
                        <Button
                          type="text"
                          onPress={this.handleRecipientTypeSelection(
                            RECIPIENT_TYPE_OTHER
                          )}
                          style={styles.button}
                        >
                          Send to a contact instead!
                        </Button>
                      </Try>
                      <Try
                        condition={
                          this.state.canChangeRecipientType &&
                          this.state.recipientType === RECIPIENT_TYPE_OTHER
                        }
                      >
                        <Button
                          type="text"
                          onPress={this.handleRecipientTypeSelection(
                            RECIPIENT_TYPE_ADDRESS
                          )}
                          style={styles.button}
                        >
                          Send to an address instead!
                        </Button>
                      </Try>
                    </Conditional>
                  </View>
                  {this.renderRecipientType(this.state.recipientType)}
                </View>
                <SelectableImageHeader
                  title="Currency"
                  emptyText="Select Currency"
                  selection={currencyDisplay}
                  onPress={this.toggleCoinSelector}
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
