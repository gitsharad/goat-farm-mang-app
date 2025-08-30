import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const initSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: `goat-farm-frontend@${process.env.REACT_APP_VERSION || '1.0.0'}`,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.2, // Adjust this value in production
      beforeSend(event) {
        // Filter out any sensitive data
        if (event.request) {
          // Remove Authorization header if present
          if (event.request.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['Cookie'];
          }
          
          // Filter URL parameters
          if (event.request.url) {
            const url = new URL(event.request.url);
            // Remove tokens from URL
            url.searchParams.delete('token');
            url.searchParams.delete('auth');
            event.request.url = url.toString();
          }
        }
        return event;
      },
    });
  }
};

export { Sentry, initSentry };
