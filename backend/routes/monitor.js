const express = require('express');
const router = express.Router();
const os = require('os');
const process = require('process');
const mongoose = require('mongoose');

/**
 * @route   GET /api/monitor/health
 * @desc    Get server health status
 * @access  Private (Admin only)
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState] || 'unknown';

    // Get memory usage
    const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
    const memoryData = process.memoryUsage();
    const memoryUsage = {
      rss: formatMemoryUsage(memoryData.rss),
      heapTotal: formatMemoryUsage(memoryData.heapTotal),
      heapUsed: formatMemoryUsage(memoryData.heapUsed),
      external: formatMemoryUsage(memoryData.external)
    };

    // Get CPU and OS info
    const cpus = os.cpus();
    const osInfo = {
      platform: os.platform(),
      release: os.release(),
      uptime: Math.floor(os.uptime() / 60) + ' minutes',
      loadavg: os.loadavg().map(load => load.toFixed(2)),
      cpu: {
        model: cpus[0].model,
        speed: cpus[0].speed,
        cores: cpus.length
      }
    };

    // Get active connections
    const connections = await new Promise((resolve) => {
      if (mongoose.connection.db) {
        mongoose.connection.db.admin().serverStatus()
          .then(status => resolve(status.connections))
          .catch(() => resolve({ active: 'N/A' }));
      } else {
        resolve({ active: 'N/A' });
      }
    });

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        connections: connections.active,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        version: (await mongoose.connection.db.admin().serverInfo()).version
      },
      memory: memoryUsage,
      system: osInfo,
      node: {
        version: process.version,
        env: process.env.NODE_ENV || 'development',
        pid: process.pid
      }
    });
  } catch (error) {
    console.error('Monitor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get server status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/monitor/requests
 * @desc    Get request statistics
 * @access  Private (Admin only)
 */
router.get('/requests', (req, res) => {
  // This would be connected to your request tracking system
  res.json({
    totalRequests: 0, // Replace with actual counter
    activeConnections: 0,
    requestsPerMinute: 0,
    lastRequest: new Date().toISOString()
  });
});

/**
 * @route   GET /api/monitor/errors
 * @desc    Get recent errors
 * @access  Private (Admin only)
 */
router.get('/errors', (req, res) => {
  // This would be connected to your error tracking system
  res.json({
    recentErrors: [],
    errorRate: 0,
    lastError: null
  });
});

module.exports = router;
