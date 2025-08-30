const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(
  path.join(logDir, 'requests.log'), 
  { flags: 'a' }
);

const simpleLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;
  const timestamp = new Date().toISOString();
  
  // Log request
  const logEntry = `[${timestamp}] ${method} ${originalUrl} from ${ip}\n`;
  logStream.write(logEntry);
  
  // Log response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const logResponse = `[${timestamp}] ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)\n`;
    logStream.write(logResponse);
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = simpleLogger;
