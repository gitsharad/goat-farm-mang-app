#!/usr/bin/env node
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  serverUrl: 'http://localhost:5000',
  frontendUrl: 'http://localhost:3000',
  endpoints: [
    '/api/health',
    '/api/subscription/me',
    '/api/goats'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ]
};

// Check if required dependencies are installed
function checkDependencies() {
  try {
    require.resolve('chalk');
  } catch (e) {
    console.log('Installing required dependencies...');
    execSync('npm install chalk@4.1.2 --no-save', { stdio: 'inherit' });
  }
}

// Test CORS preflight request
async function testCorsPreflight(url, method = 'GET') {
  return new Promise((resolve) => {
    const req = http.request({
      method: 'OPTIONS',
      hostname: new URL(url).hostname,
      port: new URL(url).port || 80,
      path: new URL(url).pathname,
      headers: {
        'Origin': CONFIG.frontendUrl,
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': CONFIG.headers.join(',')
      }
    }, (res) => {
      const result = {
        status: res.statusCode,
        headers: res.headers,
        method: 'OPTIONS',
        url,
        success: res.statusCode >= 200 && res.statusCode < 300
      };
      resolve(result);
    });

    req.on('error', (error) => {
      resolve({
        error: error.message,
        method: 'OPTIONS',
        url,
        success: false
      });
    });

    req.end();
  });
}

// Test regular CORS request
async function testCorsRequest(url, method = 'GET') {
  return new Promise((resolve) => {
    const req = http.request({
      method,
      hostname: new URL(url).hostname,
      port: new URL(url).port || 80,
      path: new URL(url).pathname,
      headers: {
        'Origin': CONFIG.frontendUrl,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const result = {
          status: res.statusCode,
          headers: res.headers,
          method,
          url,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: data ? JSON.parse(data) : null
        };
        resolve(result);
      });
    });

    req.on('error', (error) => {
      resolve({
        error: error.message,
        method,
        url,
        success: false
      });
    });

    if (method === 'POST' || method === 'PUT') {
      req.write(JSON.stringify({ test: 'cors' }));
    }
    req.end();
  });
}

// Check server configuration files
function checkServerConfig() {
  const configPath = path.join(__dirname, '..', 'backend', '.env');
  const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
  
  const results = [];
  
  // Check .env file
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const hasCorsConfig = content.includes('CORS_') || content.includes('ALLOWED_ORIGINS');
    results.push({
      check: 'CORS Configuration in .env',
      status: hasCorsConfig ? '✅ Found' : '❌ Missing',
      message: hasCorsConfig ? 'CORS configuration found in .env' : 'Add CORS_* or ALLOWED_ORIGINS to .env',
      recommended: 'Add ALLOWED_ORIGINS=http://localhost:3000 to .env'
    });
  } else {
    results.push({
      check: 'CORS Configuration in .env',
      status: '❌ Missing',
      message: '.env file not found',
      recommended: 'Create a .env file with CORS configuration'
    });
  }
  
  // Check server.js for CORS middleware
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf8');
    const hasCorsMiddleware = content.includes('cors(') || content.includes('cors =');
    results.push({
      check: 'CORS Middleware in server.js',
      status: hasCorsMiddleware ? '✅ Found' : '❌ Missing',
      message: hasCorsMiddleware ? 'CORS middleware is configured' : 'CORS middleware not found',
      recommended: 'Add CORS middleware: app.use(cors(corsOptions))'
    });
  }
  
  return results;
}

// Main function
async function main() {
  console.log(chalk.blue.bold('\n🔍 Goat Farm CORS Diagnostics\n'));
  
  // Check dependencies
  checkDependencies();
  
  // Check server configuration
  console.log(chalk.underline('\n🔧 Server Configuration Check'));
  const configResults = checkServerConfig();
  configResults.forEach(({ check, status, message, recommended }) => {
    console.log(`\n${status.padEnd(10)} ${check}`);
    console.log(`   ${message}`);
    if (recommended) {
      console.log(chalk.gray(`   💡 ${recommended}`));
    }
  });
  
  // Test CORS requests
  console.log(chalk.underline('\n🌐 Testing CORS Requests'));
  
  for (const endpoint of CONFIG.endpoints) {
    const url = `${CONFIG.serverUrl}${endpoint}`;
    console.log(`\n${chalk.bold(`Testing ${endpoint}:`)}`);
    
    // Test OPTIONS (preflight)
    const preflightResult = await testCorsPreflight(url);
    console.log(`  ${preflightResult.success ? '✅' : '❌'} OPTIONS ${endpoint} - ${preflightResult.status || 'Error'}`);
    
    if (!preflightResult.success) {
      console.log(chalk.red(`     Error: ${preflightResult.error || 'No CORS headers'}`));
      
      // Check for missing headers
      const requiredHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
      const missingHeaders = requiredHeaders.filter(h => !preflightResult.headers[h]);
      
      if (missingHeaders.length > 0) {
        console.log(chalk.yellow(`     Missing CORS headers: ${missingHeaders.join(', ')}`));
      }
    } else {
      // Test each HTTP method
      for (const method of CONFIG.methods) {
        const result = await testCorsRequest(url, method);
        console.log(`  ${result.success ? '✅' : '❌'} ${method.padEnd(6)} ${endpoint} - ${result.status || 'Error'}`);
        
        if (!result.success) {
          console.log(chalk.red(`     Error: ${result.error || 'Request failed'}`));
        } else if (!result.headers['access-control-allow-origin']) {
          console.log(chalk.yellow('     Warning: Missing Access-Control-Allow-Origin header in response'));
        }
      }
    }
  }
  
  // Final recommendations
  console.log(chalk.underline('\n📝 Recommendations:'));
  console.log(`
1. Ensure your backend has proper CORS headers:
   ${chalk.cyan('Access-Control-Allow-Origin')}: ${CONFIG.frontendUrl}
   ${chalk.cyan('Access-Control-Allow-Methods')}: ${CONFIG.methods.join(', ')}
   ${chalk.cyan('Access-Control-Allow-Headers')}: ${CONFIG.headers.join(', ')}
   ${chalk.cyan('Access-Control-Allow-Credentials')}: true`);
   
  console.log(`
2. If using credentials (cookies, authorization headers), ensure:
   - Frontend sets ${chalk.cyan('withCredentials: true')} in requests
   - Backend sets ${chalk.cyan('credentials: true')} in CORS options`);
   
  console.log(`
3. For production, restrict origins to specific domains:
   ${chalk.cyan('ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com')}`);
   
  console.log(chalk.green('\n✅ CORS check completed. See above for any issues and recommendations.'));
}

// Run the script
main().catch(console.error);
