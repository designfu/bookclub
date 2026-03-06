import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import reducers from 'reducers';

export let store = createStore(reducers,
  applyMiddleware(
    thunkMiddleware,
    createLogger(),
  )
);
