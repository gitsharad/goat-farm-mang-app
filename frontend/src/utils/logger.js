class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Maximum number of logs to keep in memory
    this.initialize();
  }

  initialize() {
    // Load existing logs from localStorage if available
    try {
      const savedLogs = localStorage.getItem('appLogs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).slice(-this.maxLogs);
      }
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
    }
  }

  saveLogs() {
    try {
      localStorage.setItem('appLogs', JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    
    // Add to console
    const consoleMethod = console[level] || console.log;
    consoleMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    
    // Add to logs
    this.logs.push(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Save to localStorage
    this.saveLogs();
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  getLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('appLogs');
  }
}

// Create a singleton instance
export const logger = new Logger();

// Export individual methods for convenience
// Export individual methods for convenience
export const logInfo = (message, data) => logger.info(message, data);
export const logError = (message, data) => logger.error(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logDebug = (message, data) => logger.debug(message, data);
export const clearLogs = () => logger.clearLogs();

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  window.appLogger = logger;
  window.logInfo = logInfo;
  window.logError = logError;
  window.logWarn = logWarn;
  window.logDebug = logDebug;
}
