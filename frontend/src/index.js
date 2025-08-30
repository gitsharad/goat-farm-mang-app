import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider, useToast } from './utils/toast';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

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
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <AppWrapper />
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Render the app
root.render(<AppWithProviders />);
