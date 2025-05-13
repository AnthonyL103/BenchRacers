import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './components/contexts/usercontext';
import { GarageProvider } from './components/contexts/garagecontext';

const rootElement = document.getElementById('root');

// Add a null check and type assertion
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
        <UserProvider>
        <GarageProvider>
      <App />
      </GarageProvider>
      </UserProvider>
    </React.StrictMode>
  );
}