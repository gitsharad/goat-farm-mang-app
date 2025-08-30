// Centralized logging service
class Logger {
  constructor() {
    this.environment = process.env.NODE_ENV;
    this.isProduction = this.environment === 'production';
  }

  // Format log message with timestamp and log level
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      environment: this.environment,
      ...data,
    };
  }

  // Send logs to the server in production
  sendToServer(logData) {
    if (this.isProduction) {
      // In production, send logs to your logging service
      // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(logData) });
    } else {
      // In development, log to console with appropriate level
      const { level, ...rest } = logData;
      const logMethod = console[level] || console.log;
      logMethod(`[${level.toUpperCase()}]`, rest);
    }
  }

  // Log levels
  info(message, data = {}) {
    const logData = this.formatMessage('info', message, data);
    this.sendToServer(logData);
  }

  warn(message, data = {}) {
    const logData = this.formatMessage('warn', message, data);
    this.sendToServer(logData);
  }

  error(message, error = null, data = {}) {
    const errorData = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.response && { response: error.response }),
      },
    } : {};
    
    const logData = this.formatMessage('error', message, {
      ...data,
      ...errorData,
    });
    
    this.sendToServer(logData);
  }

  // Performance monitoring
  trackPerformance(name, startTime, additionalData = {}) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.info(`Performance: ${name}`, {
      ...additionalData,
      duration,
      startTime,
      endTime,
    });
    
    return duration;
  }

  // API request logging
  logApiRequest(config) {
    this.info('API Request', {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data,
    });
    
    const startTime = performance.now();
    
    return (response) => {
      const duration = this.trackPerformance('API Response Time', startTime, {
        url: config.url,
        status: response?.status,
      });
      
      this.info('API Response', {
        url: config.url,
        status: response?.status,
        duration: `${duration.toFixed(2)}ms`,
      });
      
      return response;
    };
  }

  // Error boundary logging
  logErrorBoundary(error, errorInfo) {
    this.error('Error Boundary Caught', error, {
      componentStack: errorInfo?.componentStack,
    });
  }
}

// Create a singleton instance
export const logger = new Logger();

// React hook for easier usage in components
export const useLogger = () => {
  return logger;
};

export default logger;
