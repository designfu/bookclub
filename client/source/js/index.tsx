import './debug';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { AppComponent } from 'components/hybrid/AppComponent';
import { store } from 'reducers/store';

const mountNode = document.getElementById('mount');

if (mountNode) {
  createRoot(mountNode).render(
    <Provider store={store}>
      <AppComponent />
    </Provider>
  );
}
