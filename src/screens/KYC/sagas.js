/**
|--------------------------------------------------
| KYC Saga
|--------------------------------------------------
*
*  This handles all side-effects for validating a user
*
*/

import { call, put, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';
import Config from 'react-native-config';

import {
  DOCUMENT_VERIFICATION_REQUESTING,
  DOCUMENT_VERIFICATION_SUCCESS,
  DOCUMENT_VERIFICATION_RETRY
} from './constants';
//
// // TODO: abstract these into dev/prod files
// const kycUrl = `${Config.EREBOR_ENDPOINT}/kyc/`;
//
const mockKYCcheckAPI = user_information => {
  const randMax = 10;
  const rand = Math.floor(Math.random() * randMax);

  if (rand === 1) {
    return {
      user: 1,
      authorized: 'authorized',
      body: 'user is all cleared.',
      user_information
    };
    // setKYCKey(key, value) {
    // const user = await AsyncStorage.getItem('kyc/user');
    // const parsed = JSON.parse(user);
    // return parsed;
  } else if (rand === 0) {
    return {
      user: 1,
      authorized: 'rejected',
      body: 'user was on a list.'
    };
  } else {
    throw { success: false, body: 'kyc is still waiting....' };
  }
};

/**
 * Get User from AsyncStorage
 * @return {object} the user object describing the current user.
 */
async function getKYC() {
  const user = await AsyncStorage.getItem('kyc/user');
  const parsed = JSON.parse(user);
  return parsed;
}

/**
 * Set User to AsyncStorage
 * @param {object} user object describing the current user.
 * @return {async function} Handles setting the user in localstorage during each
 * session
 */
async function setKYC(user) {
  return await AsyncStorage.setItem('kyc/user', JSON.stringify(user));
}

async function setKYCKey(key, value) {
  const user = await AsyncStorage.getItem('kyc/user');
  const parsed = JSON.parse(user);
  const newUser = { ...user };
  newUser[key] = value;
  return await AsyncStorage.setItem(`kyc/user`, JSON.stringify(newUser));
}

function* peridociallyCheckKycStatus(user_credentials) {
  while (true) {
    try {
      const apiResponse = yield call(mockKYCcheckAPI, user_credentials);
      return apiResponse;
    } catch (error) {
      yield put({
        type: DOCUMENT_VERIFICATION_RETRY,
        error
      });
      yield call(delay, 2000);
    }
  }
}

function* kycCheck({ user_credentials }) {
  let currentUser = yield call(getKYC);

  const kycStatus = yield call(peridociallyCheckKycStatus, user_credentials);
  yield put({
    type: DOCUMENT_VERIFICATION_SUCCESS,
    authorized: kycStatus.authorized,
    user_information: kycStatus.user_information
  });
}

export default function* kycStatusWatcher() {
  yield takeLatest(DOCUMENT_VERIFICATION_REQUESTING, kycCheck);
}
