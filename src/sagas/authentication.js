import { AsyncStorage } from 'react-native';
import { call, take, select, put } from 'redux-saga/effects';

import NavigatorService from 'lib/navigator';
import Config from 'react-native-config';
import api from 'lib/api';

import loginFlow from 'screens/Login/sagas';
import { LOGIN_REQUESTING } from 'screens/Login/constants';
import { SIGNUP_REQUESTING } from 'screens/Signup/constants';
import { INIT_REQUESTING } from 'containers/App/constants';
import { WALLET_INITIALIZE_PASSPHRASE } from 'screens/Wallet/constants';
import signupFlow from 'screens/Signup/sagas';

export const AUTH_USER_SET = 'AUTH_USER_SET';
export const AUTH_SIGNOUT = 'AUTH_SIGNOUT';
export const AUTH_USER_STORAGE_KEY = 'auth/user';

import { UPDATE_USER } from 'containers/User/constants';
import updateUser from 'containers/User/actions';
import { store } from '../App.js';
import {
  isMnemonicInitializedSelector,
  mnemonicPhraseSelector,
} from 'screens/Wallet/selectors';

/**
 * Sign Out - Redux action
 * @return {object} the redux dispatch object
 */
export function signOut() {
  return {
    type: AUTH_SIGNOUT,
  };
}

// TODO: abstract these into dev/prod files
const checkUserSessionUrl = `${Config.EREBOR_ENDPOINT}/users/`;
/**
 * checkSessionApi
 * @return {async function} Calls the backend to check the status of the user's session.
 */
export async function checkSessionApi(currentUser) {
  try {
    return api.get(`${checkUserSessionUrl}${currentUser.user_uid}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Get User from AsyncStorage
 * @return {object} the user object describing the current user.
 */
export async function getUser() {
  let user = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
  user = JSON.parse(user);

  // convert old user.uid to more specific user.user_uid
  // TODO: remove when we no longer want to support user.uid structure
  if (user && user.uid && !user.user_uid) {
    const { uid, ...otherKeys } = user;
    user = { ...otherKeys, user_uid: uid };
  }

  if (user && user.user_uid) {
    try {
      await checkSessionApi(user);
    } catch (error) {
      await setUser('');
      store.dispatch(updateUser(null));
      NavigatorService.navigate('Login');
      return;
    }
  }

  return user;
}

/**
 * Set User to AsyncStorage
 * @param {object} user object describing the current user.
 * @return {async function} Handles setting the user in localstorage during each
 * session
 */
export async function setUser(user) {
  return await AsyncStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(user)
  );
}

// TODO: abstract these into dev/prod files
const logoutUrl = `${Config.EREBOR_ENDPOINT}/logout/`;
/**
 * Logout
 * @return {async function} Calls the backen to remove the user's session.
 */
export async function logoutApi() {
  try {
    return api.post(logoutUrl);
  } catch (error) {
    throw error;
  }
}

/**
 * LogoutFlow saga
 * @return {Generator} This saga handles all events to log a user out.
 */
export function* logoutFlow() {
  // First, let's log the user out of the backend
  yield call(logoutApi);
  // Then, let's clear the user from our local storage and state
  yield put(updateUser(null));
  yield call(setUser, '');
}

/**
 * Authentication Watcher Saga
 * @return {Generator} this is root authentication saga that listens for any
 * authentication-related actions dispatched from redux.
 */
export default function* authenticationWatcher() {
  // The while(true) loop establishes a "daemon" of sorts, that will continually
  // loop, stopping at whichever yield calls or blocking effects necessary

  // make sure not to start the loop before the app is ready
  yield take(INIT_REQUESTING);

  while (true) {
    // Before anything, let's check to see if the user is already logged in
    let currentUser = yield call(getUser);
    let action = {};

    // If there's no user, let's try to get them sign them in, somehow
    if (!currentUser) {
      // First, we need to listen for any authentication-related actions
      // dispatched from redux
      action = yield take([LOGIN_REQUESTING, SIGNUP_REQUESTING]);

      // We only want to be handling one "let's get the user in" action at
      // a time. We'll try to login or signup and store the response from the
      // server as the currentUser
      switch (action.type) {
        case LOGIN_REQUESTING:
          yield call(setUser, '');
          currentUser = yield call(loginFlow, action);
          break;
        case SIGNUP_REQUESTING:
          currentUser = yield call(signupFlow, action);
          break;
      }

      // If for some reason we were not able to create a currentUser either by
      // logging in or signing up, we don't know what to do.
      if (!currentUser) {
        // TODO: throw a helpful error to tell the user to try again?
        //  yield put({ type: LOGIN_OR_SIGNUP_ERROR, errors: [errors] });
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            'hmmm... try again soon. maybe the api is down, or you made a bad request?'
          );
        }

        //restart the authentication loop so they try can login or signup again
        continue;
      }

      // Finally, since we have a currentUser, we store their session/uid locally
      yield call(setUser, currentUser);
    }

    // Let's also allow dispatched actions to stay on their current page
    // Note: this will be helpful for interjecting auth-sagas without a user
    // losing their current context (ie, "hey before you can buy, you have to
    // log in quickly!")
    if (!action.noRedirect) {
      const isMnemonicInitialized = yield select(isMnemonicInitializedSelector);

      if (!isMnemonicInitialized) {
        yield take(WALLET_INITIALIZE_PASSPHRASE);
      }

      const mnemonicPhrase = yield select(mnemonicPhraseSelector);

      if (mnemonicPhrase) {
        NavigatorService.resetReplace('Login', 'Menu');
      } else {
        NavigatorService.navigate('Mnemonic');
      }
    }

    // If we've gotten this far, we have a currentUser and will wait and listen
    // for any logout-related actions, and if dispatched, we'll log them out and
    // redirect them to the Login screen.
    yield put(updateUser(currentUser));
    yield take([AUTH_SIGNOUT /* all other unset actions */]);
    yield call(logoutFlow);
    NavigatorService.navigate('Login');
  }
}
