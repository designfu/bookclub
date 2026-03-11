import { combineReducers } from 'redux';
import { UserReducer } from 'reducers/UserReducer';
import { BookReducer } from 'reducers/BookReducer';
import { SeasonReducer } from 'reducers/SeasonReducer';
import { VotingSessionReducer } from 'reducers/VotingSessionReducer';
import { AppstateReducer } from 'reducers/AppstateReducer';
import { ReduxReducer } from 'reducers/ReduxReducer';

const reducers = combineReducers({
  users: UserReducer,
  books: BookReducer,
  seasons: SeasonReducer,
  votingSession: VotingSessionReducer,
  appstate: AppstateReducer,
  redux: ReduxReducer,
});

export default reducers;
