import React from 'react';
import Config from 'react-native-config';
import PropTypes from 'prop-types';
import Fetch, { makeRequest } from 'components/Fetch';

const url = `${Config.EREBOR_ENDPOINT}/pricing_data/pricemulti`;

const constructQueries = ( currencies, tradingPair ) => [
  { name: 'fsyms', value: currencies.join(',') },
  { name: 'tsyms', value: tradingPair },
];

export async function getCurrencyPrice(currencies, tradingPair) {
  return makeRequest(url, constructQueries(currencies, tradingPair));
}

export default class GetCurrencyPrice extends React.Component {
  static propTypes = {
    currencies: PropTypes.arrayOf(PropTypes.string),
    children: PropTypes.func, // recieves {loaded, data}
  };

  constructor(props) {
    super();
    this.state = {
      queries: constructQueries(props.currencies),
    };
  }

  componentWillReceiveProps(newProps) {
    if (newProps.currencies !== this.props.currencies) {
      this.setState({
        queries: constructQueries(newProps.currencies),
      });
    }
  }

  formatter = json => json;

  render() {
    return (
      <Fetch url={url} queries={this.state.queries} formatter={this.formatter}>
        {this.props.children}
      </Fetch>
    );
  }
}
