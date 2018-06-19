import React from 'react';
import Config from 'react-native-config';
import PropTypes from 'prop-types';
import Fetch, { makeRequest } from 'components/Fetch';

export const Intervals = {
  hour: '1H',
  day: '1D',
  week: '1W',
  month: '1M',
  year: '1Y',
  multiYear: '5Y',
  all: 'ALL',
};

const getAggregateValue = interval => {
  switch (interval) {
    case Intervals.hour:
    case Intervals.day:
      return 1;
    case Intervals.week:
      return 7;
    case Intervals.month:
      return 30;
    case Intervals.year:
      return 365;
    case Intervals.multiYear:
      return 1825;
    case Intervals.all:
    default:
      return 2000;
  }
};

const constructQueries = (currency, tradingPair, limit, interval, aggregate) => [
  { name: 'fsym', value: currency },
  { name: 'tsym', value: tradingPair },
  { name: 'limit', value: limit },
  { name: 'aggregate', value: aggregate || getAggregateValue(interval) },
];

const getUrl = interval => {
  switch (interval) {
    case Intervals.hour:
      return `${Config.EREBOR_ENDPOINT}/pricing_data/histohour`;
    case Intervals.day:
    case Intervals.week:
    case Intervals.month:
    case Intervals.year:
    case Intervals.multiYear:
    case Intervals.all:
    default:
      return `${Config.EREBOR_ENDPOINT}/pricing_data/histoday`;
  }
};

const defaultFormatter = json => json.Data.map(day => day.close);

export async function getCurrencyHistory(
  currency,
  tradingPair = 'USD',
  limit = '60',
  interval = Intervals.hour,
  aggregate,
  formatter = defaultFormatter
) {
  const json = await makeRequest(
    getUrl(interval),
    constructQueries(currency, tradingPair, limit, interval, aggregate)
  );
  return formatter(json);
}

export default class GetCurrencyHistory extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired, // recieves {loaded: bool, data: any}
    currency: PropTypes.string.isRequired,
    interval: PropTypes.oneOf(Object.values(Intervals)),
    limit: PropTypes.string,
  };

  static defaultProps = {
    interval: Intervals.hour,
    limit: '60',
  };

  constructor(props) {
    super();
    this.state = {
      queries: constructQueries(props.currency, props.limit, props.interval),
      url: getUrl(props.interval),
    };
  }

  componentWillReceiveProps(newProps) {
    if (
      newProps.currency !== this.props.currency ||
      newProps.limit !== this.props.limit ||
      newProps.interval !== this.props.interval
    ) {
      this.setState({
        queries: constructQueries(
          newProps.currency,
          newProps.limit,
          newProps.interval
        ),
        url: getUrl(newProps.interval),
      });
    }
  }

  render() {
    const { children } = this.props;
    const { queries, url } = this.state;
    return (
      <Fetch url={url} queries={queries} formatter={defaultFormatter}>
        {children}
      </Fetch>
    );
  }
}
