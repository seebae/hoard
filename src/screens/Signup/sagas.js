/**
|--------------------------------------------------
| Signup Saga
|--------------------------------------------------
* 
*  This handles all side-effects for new user signup.
*  Any token storage, anylitics tracking, or app
*  redirection can be triggered here.
*  
*/

import { call, put } from "redux-saga/effects";
import { SIGNUP_SUCCESS, SIGNUP_ERROR } from "./constants";
import api from "lib/api";

// TODO: abstract these into dev/prod files
const signupUrl = `https://smaugdev.hoardinvest.com/users/`;

async function signupApi(
  first_name,
  last_name,
  phone_number,
  email_address,
  password
) {
  try {
    return api.post(signupUrl, {
      first_name,
      last_name,
      phone_number,
      email_address,
      password
    });
  } catch (error) {
    throw error;
  }
}

// This will be run when the SIGNUP_REQUESTING
export default function* signupFlow(action) {
  let response;
  try {
    const {
      first_name,
      last_name,
      phone_number,
      email_address,
      password
    } = action;

    // pulls "calls" to our signupApi with our email and password
    // from our dispatched signup action, and will PAUSE
    // here until the API async function, is complete!
    response = yield call(
      signupApi,
      first_name,
      last_name,
      phone_number,
      email_address,
      password
    );

    // when the above api call has completed it will "put",
    // or dispatch, an action of type SIGNUP_SUCCESS with
    // the successful response.
    yield put({ type: SIGNUP_SUCCESS, response });
  } catch (error) {
    // TODO: return nice-looking errors to the user
    yield put({ type: SIGNUP_ERROR, error: error.message });
  }

  return response;
}