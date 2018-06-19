import ethers from 'ethers';
import Config from 'react-native-config';
import {
  SYMBOL_ETH
} from "containers/App/constants";
import { AsyncStorage } from 'react-native';
import { channel } from 'redux-saga';
import { fork, all, take, select, takeEvery, call, put } from "redux-saga/effects";
import { WALLET_IMPORT_SUCCESS, WALLET_TRACK_SYMBOL_SUCCESS } from "screens/Wallet/constants";
import { walletsForSymbolSelector } from "screens/Wallet/selectors";
import { RequestLimiter, asyncMemoize, getHalfwayPoint, Queue } from './helpers';
import {
  BLOCK_ADDED_TO_QUEUE,
  BLOCK_NUMBER_STORAGE_KEY,
  SEARCH_FOR_INTERESTING_BLOCKS,
  INTERESTING_BLOCK_FOUND
} from './constants';

import {
  blockAddedToQueue,
  blockUpdated,
  interestingBlockFound,
  transactionFound,
  triggerSearchForInterestingBlocks
} from './actions';

import {bigNumberToEther} from 'lib/formatters';

export const network = ethers.providers.networks.ropsten;
export const provider = ethers.providers.getDefaultProvider(network);

export const actionBridgeChannel = channel();
export let lastCheckedBlockNumber = {};
export let fetchingBlockNumber = false;
export let transactionsBlockQueue = new Queue();
export let searchInRangeList = [];

export const getTransaction = asyncMemoize(provider.getTransaction.bind(provider));
export const getTransactionCount = asyncMemoize(provider.getTransactionCount.bind(provider));
export const getBlock = asyncMemoize(provider.getBlock.bind(provider));
export const getBalance = asyncMemoize(provider.getBalance.bind(provider));

export const timestampPriceApi = new RequestLimiter(
  `${Config.EREBOR_ENDPOINT}/pricing_data/pricehistorical`,
  {numRequests: 15, perTimestamp: 1000},
  (response) => response.Type === 99
);

export default function* ethTransactionsSagaWatcher() {
  yield all([
    call(initialize),
    takeEvery([WALLET_IMPORT_SUCCESS, WALLET_TRACK_SYMBOL_SUCCESS], listenForWalletEvents), // takes publicAddress, symbol
    takeEvery(SEARCH_FOR_INTERESTING_BLOCKS, fetchHistoryEth),
    takeEvery(INTERESTING_BLOCK_FOUND, addBlockToQueue),
  ]);
}

// INITIALIZATION FUNCTIONS
export function* initialize() {
  yield fork(setupActionBridgeChannel);
  yield fork(processTransactionsBlockQueue);
  yield call(hydrate);
}

export function* setupActionBridgeChannel() {
  while (true) {
    const action = yield take(actionBridgeChannel);
    yield put(action);
  }
}

export function* processTransactionsBlockQueue() {
  while (true) {
    if (!transactionsBlockQueue.length) {
      yield take(BLOCK_ADDED_TO_QUEUE);
    }

    const { block, transactionCount } = yield call(transactionsBlockQueue.pop);
    const wallets = yield select(state => walletsForSymbolSelector(state, SYMBOL_ETH));
    yield call(searchBlockForTransactions, block, wallets.map(w => w.publicAddress), transactionCount);
  }
}

export function listenForWalletEvents(action) {
  const { symbol, publicAddress } = action.payload;

  if (symbol === SYMBOL_ETH) {
    provider.on(publicAddress, () => {
      actionBridgeChannel.put(triggerSearchForInterestingBlocks(publicAddress));
    });
  }
}

export function* hydrate() {
  const savedBlockNumber = yield call(AsyncStorage.getItem, BLOCK_NUMBER_STORAGE_KEY);
  let blockNumber = {};

  if (savedBlockNumber) {
    try {
      blockNumber = JSON.parse(savedBlockNumber);
    } catch(e) {
      blockNumber = {};
    }
  }

  lastCheckedBlockNumber = blockNumber;
  return lastCheckedBlockNumber;
}

// SIMPLE FUNCTIONS
export function* updateLastCheckedBlockNumber(address, blockNumber) {
  lastCheckedBlockNumber = {
    ...lastCheckedBlockNumber,
    [address]: blockNumber
  };
  yield call(AsyncStorage.setItem, BLOCK_NUMBER_STORAGE_KEY, JSON.stringify(lastCheckedBlockNumber));
  yield put(blockUpdated());
}

export function* addBlockToQueue(action) {
  transactionsBlockQueue.push(action.block);
  yield put(blockAddedToQueue());
}

export function getLastCheckedBlockForAddress(address) {
  return lastCheckedBlockNumber[address] || 0;
}

// BLOCK SEARCH FUNCTIONS
export function* fetchHistoryEth(action) {
  const { publicAddress } = action;

  const startBlockNumber = yield call(getLastCheckedBlockForAddress, publicAddress);
  let mostRecentBlockNumber = startBlockNumber;
  let mostRecentSearch;
  try {
    mostRecentBlockNumber = yield call(provider.getBlockNumber.bind(provider));
    mostRecentSearch = {
      publicAddress,
      startBlockNumber,
      endBlockNumber: mostRecentBlockNumber
    };
  } catch(e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('error encountered while fetching most recent block number: ', e);
    }
  }

  // search through previous list of errored out blocks first
  const searchThroughRanges = mostRecentSearch
    ? [
      ...searchInRangeList,
      mostRecentSearch
    ]
    : searchInRangeList;

  // empty out list of previously errored blocks
  searchInRangeList = [];

  yield all(
    searchThroughRanges
      .map(
        item => call(searchForInterestingBlocks, item.publicAddress, item.startBlockNumber, item.endBlockNumber)
      )
  );


  yield call(updateLastCheckedBlockNumber, publicAddress, mostRecentBlockNumber);
}


export function* searchForInterestingBlocks(publicAddress, startBlockNumber, endBlockNumber) {
  try {
    const startTransactionCount = yield call(getTransactionCount, publicAddress, startBlockNumber);
    const endTransactionCount = yield call(getTransactionCount, publicAddress, endBlockNumber);

    let transactionCount = endTransactionCount - startTransactionCount;

    if (startTransactionCount === endTransactionCount) {
      const startBalance = yield call(getBalance, publicAddress, startBlockNumber);
      const endBalance = yield call(getBalance, publicAddress, endBlockNumber);

      const difference = endBalance - startBalance;

      if (difference === 0) {
        // since we have not sent (startTransactionCount === endTransactionCount), and we effectively haven't received anything
        // we can safely cut this branch off
        return;
      } else {
        // hmmm..... there's a price discrepancy here. we don't really know how many transactions have happened to cause this,
        // so we'll need to loop through the whole block for this one
        transactionCount = Infinity;
      }
    }

    const halfwayBlockNumber = getHalfwayPoint(startBlockNumber, endBlockNumber);

    if (halfwayBlockNumber) {
      yield fork(searchForInterestingBlocks, publicAddress, startBlockNumber, halfwayBlockNumber);
      yield fork(searchForInterestingBlocks, publicAddress, halfwayBlockNumber, endBlockNumber);
    } else {
      yield put(interestingBlockFound({
        block: endBlockNumber,
        publicAddress,
        transactionCount: transactionCount
      }));
    }
  } catch(e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`error in searching range ${startBlockNumber} - ${endBlockNumber} for address: ${publicAddress}`, e);
    }

    searchInRangeList.push({
      publicAddress,
      startBlockNumber,
      endBlockNumber
    });
  }
}

export function* searchBlockForTransactions(blockNumber, addresses, transactionCount) {
  try {
    const transactionList = [];
    // first fetch the full block
    const block = yield call(getBlock, blockNumber);

    // now, loop through all of the transactions in the block
    for (let transactionIndex = 0; transactionIndex < block.transactions.length; transactionIndex++) {

      // we have to get the full transaction object
      const transaction = yield call(getTransaction, block.transactions[transactionIndex]);

      // and check if we have either sent or recieved funds
      if (addresses.includes(transaction.to) || addresses.includes(transaction.from)) {
        const price = yield call(timestampPriceApi.makeRequest, `?fsym=ETH&tsyms=USD&ts=${block.timestamp}`);
        const action = {
          ...transaction,
          timeMined: block.timestamp * 1000,
          priceAtTimeMined: price.ETH.USD,
          gasPrice: bigNumberToEther(transaction.gasPrice),
          gasLimit: bigNumberToEther(transaction.gasLimit),
          value: bigNumberToEther(transaction.value)
        };

        transactionList.push(action);

        yield put(transactionFound(action));

        // increment the number of counted transactions.
        // if we have hit all of our events in this block,
        if (transactionList.length === transactionCount) {
          //  we jump instantly to the next block
          break;
        }
      }
    }

    return transactionList;
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`error in searching block ${blockNumber} for transactions`, e);
    }

    // if we ran into an issue with this block, put it back in the queue
    yield put(interestingBlockFound({
      block: blockNumber,
      transactionCount: transactionCount
    }));
  }
}
