/**
 * Application entry point.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppWithGroups } from './AppWithGroups';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithGroups />
  </React.StrictMode>,
);
