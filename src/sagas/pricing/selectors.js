import { createSelector } from 'reselect';
import { allWalletsSelector } from 'screens/Wallet/selectors';

export const totalHoldingsSelector = createSelector(
  allWalletsSelector,
  state => state.pricing,
  (wallets, pricing) => wallets.reduce(
    (totalHoldings, {symbol, balance}) => {
      const price = pricing[symbol].price.price;
      if (price && balance) {
        return totalHoldings + (price * balance);
      }
      return totalHoldings;
    },
    0
  )
);

export const allPricesLoadedSelector = createSelector(
  allWalletsSelector,
  state => state.pricing,
  (wallets, pricing) => wallets.reduce(
    (allPricesLoaded, {symbol}) => {
      return allPricesLoaded && !pricing[symbol].price.requesting;
    },
    true
  )
);
