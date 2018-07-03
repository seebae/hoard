import { createSelector } from 'reselect';

export const userStateSelector = state => state.user;

export const userSelector = createSelector(
  userStateSelector,
  userState => userState.user
);

export const userFullNameSelector = createSelector(
  userSelector,
  (user = {}) => [user.firstName, user.lastName].filter(v => v).join(' ')
);

export const userUidSelector = createSelector(
  userSelector,
  (user = {}) => user.user_uid
);

export const isSignedInSelector = createSelector(
  userUidSelector,
  user_uid => !!user_uid
);


export const emailSelector = createSelector(
  userSelector,
  (user = {}) => user.email_address
);
