import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import { App } from './routes';
import {PublicLocale} from './public-locale';
import './styles.css';
import './design-system.css';
import './public-premium.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><Provider store={store}><PublicLocale><BrowserRouter><App /></BrowserRouter></PublicLocale></Provider></React.StrictMode>);
