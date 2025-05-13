import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './components/usercontext';

const rootElement = document.getElementById('root');

// Add a null check and type assertion
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
        <UserProvider>
      <App />
      </UserProvider>
    </React.StrictMode>
  );
}