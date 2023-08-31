import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { rootReducer } from './store';

export default function configureStore() {
  console.log("dddddd")

  return createStore(rootReducer, applyMiddleware(thunk));
}
