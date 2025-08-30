const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const { version } = require('../../../package.json');

const initSentry = (app) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: `goat-farm-backend@${version}`,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
        // Enable MongoDB tracing if needed
        // new Tracing.Integrations.Mongo(),
      ],
      tracesSampleRate: 0.2, // Adjust this value in production
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          const sensitiveHeaders = [
            'authorization',
            'cookie',
            'set-cookie',
            'x-api-key',
            'api-key',
          ];
          
          if (event.request.headers) {
            sensitiveHeaders.forEach(header => {
              delete event.request.headers[header];
              const headerLower = header.toLowerCase();
              if (event.request.headers[headerLower]) {
                event.request.headers[headerLower] = '[Filtered]';
              }
            });
          }
          
          // Filter URL parameters
          if (event.request.url) {
            const url = new URL(event.request.url, 'http://placeholder');
            ['token', 'auth', 'password', 'secret'].forEach(param => {
              if (url.searchParams.has(param)) {
                url.searchParams.set(param, '[Filtered]');
              }
            });
            event.request.url = url.toString().replace('http://placeholder', '');
          }
        }
        
        // Filter sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              const sensitiveFields = ['password', 'token', 'auth', 'secret', 'apiKey'];
              sensitiveFields.forEach(field => {
                if (breadcrumb.data[field]) {
                  breadcrumb.data[field] = '[Filtered]';
                }
              });
            }
            return breadcrumb;
          });
        }
        
        return event;
      },
    });
    
    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
  
  return Sentry;
};

const errorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all 404 and 500 errors
      if (error.status === 404 || error.status === 500) {
        return true;
      }
      // Capture all unhandled rejections and exceptions
      return !error.status || error.status >= 400;
    },
  });
};

module.exports = { Sentry, initSentry, errorHandler };
