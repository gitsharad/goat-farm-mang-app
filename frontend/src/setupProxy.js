const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const proxyOptions = {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    // Remove the /api prefix when forwarding to the backend
    pathRewrite: {
      '^/api': ''
    },
    // Handle WebSockets
    ws: true,
    // Don't verify SSL certificates
    ssl: false,
    // Preserve the host header
    preserveHeaderKeyCase: true,
    // Auto rewrite location headers
    autoRewrite: true,
    // Protocol rewrite
    protocolRewrite: 'http',
    // Timeout settings
    timeout: 30000,
    // Handle proxy errors
    onError: (err, req, res) => {
      console.error('Proxy error:', {
        error: err,
        url: req.originalUrl,
        method: req.method,
        headers: req.headers
      });
      
      if (!res.headersSent) {
        if (res.writeHead && !res.finished) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({
          success: false,
          error: 'Proxy error',
          message: err.message,
          code: 'PROXY_ERROR'
        }));
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Skip hot-update files
      if (req.url.includes('hot-update')) {
        return res.end();
      }
      
      // Remove any existing cache-control headers to prevent CORS issues
      proxyReq.removeHeader('cache-control');
      proxyReq.removeHeader('Cache-Control');
      
      // Add necessary CORS headers
      proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
      proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
      proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma, Expires');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Skip hot-update files
      if (req.url.includes('hot-update')) {
        return res.end();
      }
      
      // Ensure CORS headers are set in the response
      proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma, Expires';
      
      // Remove any problematic cache headers
      delete proxyRes.headers['cache-control'];
      delete proxyRes.headers['Cache-Control'];
    }
  };

  app.use('/api', createProxyMiddleware(proxyOptions));
};
