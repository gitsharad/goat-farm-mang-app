import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider, useToast } from './utils/toast';
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Initialize React root
const container = document.getElementById('root');
const root = createRoot(container);

// Create a wrapper component that will handle the toast container
const AppWrapper = () => {
  const { ToastContainer } = useToast();
  
  return (
    <>
      <App />
      <ToastContainer />
    </>
  );
};

// Wrap the app with providers
const AppWithProviders = () => (
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppWrapper />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
);

// Render the app
root.render(<AppWithProviders />);
