const { exec } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 5000;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;
let retryCount = 0;

function checkServerHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/health-check`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Server is healthy: ${data}`);
          retryCount = 0; // Reset retry count on success
          resolve(true);
        } else {
          console.error(`❌ Server returned status code: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Health check failed: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.error('❌ Health check timed out');
      resolve(false);
    });
  });
}

function restartServer() {
  console.log('🔄 Restarting server...');
  
  // Kill existing node process
  if (process.platform === 'win32') {
    exec('taskkill /F /IM node.exe');
  } else {
    exec('pkill -f node');
  }

  // Start the server
  const serverProcess = exec('npm start', {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  return serverProcess;
}

async function monitor() {
  const isHealthy = await checkServerHealth();
  
  if (!isHealthy) {
    retryCount++;
    console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
    
    if (retryCount >= MAX_RETRIES) {
      console.log('Max retries reached, restarting server...');
      restartServer();
      retryCount = 0;
    }
  }
  
  // Schedule next health check
  setTimeout(monitor, HEALTH_CHECK_INTERVAL);
}

// Start monitoring
console.log('🚀 Starting server monitor...');
restartServer(); // Initial start
setTimeout(monitor, 10000); // Start monitoring after 10 seconds
