import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from '@shared/context/ThemeContext.jsx';
import '@shared/styles/App.css';

// Set data-app attribute for styling
document.documentElement.setAttribute('data-app', 'user');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
