import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, BaseStyles } from '@primer/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <BaseStyles>
          <App />
        </BaseStyles>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
