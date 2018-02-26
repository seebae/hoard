/**
|--------------------------------------------------
| Root Saga - combines all sagas throughout the app
|--------------------------------------------------

Usage:
import example from "path/to/Example/sagas";

Add to rootSaga's all method:
yield all([example(), ...otherSagas]);

*/

import { all } from 'redux-saga/effects';

import authSagas from 'sagas/authentication';
import initSagas from 'sagas/init';
import walletSagas from 'screens/Wallet/sagas';
import pricingSagas from 'sagas/pricing/saga';

export default function* rootSaga() {
  yield all([
    initSagas(),
    authSagas(),
    walletSagas(),
    pricingSagas()
  ]);
}