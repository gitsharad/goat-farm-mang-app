const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry for error tracking and performance monitoring
 * @param {Object} app - Express app instance
 * @returns {Object} Sentry instance
 */
const initSentry = (app) => {
  // Only initialize Sentry if DSN is provided
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Add profiling integration
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());

    console.log('Sentry initialized successfully');
  } else {
    console.warn('Sentry DSN not provided. Error tracking is disabled.');
  }

  return Sentry;
};

/**
 * Error handler for Sentry
 */
const errorHandler = {
  // The error handler must be before any other error middleware
  handleErrors: (err, req, res, next) => {
    if (process.env.SENTRY_DSN) {
      // Flush out the current requests before sending the response
      Sentry.flush(2000).then(() => {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      });
    } else {
      next(err);
    }
  },

  // Custom error handler for async/await
  asyncErrorHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },
};

module.exports = {
  initSentry,
  errorHandler: errorHandler,
};
