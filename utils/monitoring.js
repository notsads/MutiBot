const os = require('os');
const { logInfo, logWarning, logError, logSuccess } = require('./utils');

class BotMonitor {
  constructor(client) {
    this.client = client;
    this.startTime = Date.now();
    this.metrics = {
      commands: new Map(),
      errors: [],
      performance: [],
      uptime: 0,
      memoryUsage: [],
      cpuUsage: []
    };
    
    this.startMonitoring();
  }

  // Start monitoring
  startMonitoring() {
    // Monitor system performance every 30 seconds
    this.performanceInterval = setInterval(() => {
      this.recordPerformance();
    }, 30000);

    // Monitor memory usage every minute
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 60000);

    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);

    logSuccess('📊 Advanced monitoring system started');
  }

  // Record performance metrics
  recordPerformance() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metric = {
      timestamp: Date.now(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      guilds: this.client.guilds.cache.size,
      users: this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
    };

    this.metrics.performance.push(metric);
    
    // Keep only last 100 performance records
    if (this.metrics.performance.length > 100) {
      this.metrics.performance.shift();
    }

    // Check for high memory usage
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      logWarning(`High memory usage detected: ${heapUsedMB.toFixed(2)} MB`);
    }
  }

  // Record memory usage
  recordMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const systemMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    const memoryMetric = {
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      systemTotal: systemMemory,
      systemFree: freeMemory,
      systemUsed: systemMemory - freeMemory
    };

    this.metrics.memoryUsage.push(memoryMetric);
    
    // Keep only last 60 memory records
    if (this.metrics.memoryUsage.length > 60) {
      this.metrics.memoryUsage.shift();
    }
  }

  // Record command usage
  recordCommand(commandName, userId, guildId, executionTime, success = true) {
    if (!this.metrics.commands.has(commandName)) {
      this.metrics.commands.set(commandName, {
        totalUses: 0,
        uniqueUsers: new Set(),
        guilds: new Set(),
        averageExecutionTime: 0,
        errors: 0,
        lastUsed: null
      });
    }

    const command = this.metrics.commands.get(commandName);
    command.totalUses++;
    command.uniqueUsers.add(userId);
    if (guildId) command.guilds.add(guildId);
    command.lastUsed = Date.now();

    // Update average execution time
    const totalTime = command.averageExecutionTime * (command.totalUses - 1) + executionTime;
    command.averageExecutionTime = totalTime / command.totalUses;

    if (!success) {
      command.errors++;
    }
  }

  // Record error
  recordError(error, context = {}) {
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context,
      type: error.constructor.name
    };

    this.metrics.errors.push(errorRecord);
    
    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }

    logError(`Error recorded: ${error.message}`);
  }

  // Get system health
  getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryPercentage = (heapUsedMB / heapTotalMB) * 100;

    const systemMemory = os.totalmem();
    const freeMemory = os.freemem();
    const systemMemoryPercentage = ((systemMemory - freeMemory) / systemMemory) * 100;

    return {
      status: this.getHealthStatus(memoryPercentage, systemMemoryPercentage),
      memory: {
        heapUsed: heapUsedMB.toFixed(2),
        heapTotal: heapTotalMB.toFixed(2),
        heapPercentage: memoryPercentage.toFixed(2),
        systemPercentage: systemMemoryPercentage.toFixed(2)
      },
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      performance: {
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
        platform: os.platform(),
        arch: os.arch()
      },
      bot: {
        guilds: this.client.guilds.cache.size,
        users: this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        commands: this.client.commands ? this.client.commands.size : 0,
        ready: this.client.isReady()
      }
    };
  }

  // Get health status
  getHealthStatus(memoryPercentage, systemMemoryPercentage) {
    if (memoryPercentage > 90 || systemMemoryPercentage > 90) {
      return 'critical';
    } else if (memoryPercentage > 75 || systemMemoryPercentage > 75) {
      return 'warning';
    } else if (memoryPercentage > 50 || systemMemoryPercentage > 50) {
      return 'moderate';
    } else {
      return 'healthy';
    }
  }

  // Get analytics data
  getAnalytics() {
    const commandUsage = Array.from(this.metrics.commands.entries()).map(([name, data]) => ({
      name,
      totalUses: data.totalUses,
      uniqueUsers: data.uniqueUsers.size,
      guilds: data.guilds.size,
      averageExecutionTime: data.averageExecutionTime,
      errors: data.errors,
      lastUsed: data.lastUsed
    }));

    const recentErrors = this.metrics.errors.slice(-10);
    const recentPerformance = this.metrics.performance.slice(-24); // Last 24 records

    return {
      commands: commandUsage,
      errors: recentErrors,
      performance: recentPerformance,
      summary: {
        totalCommands: commandUsage.reduce((acc, cmd) => acc + cmd.totalUses, 0),
        totalErrors: recentErrors.length,
        averageMemoryUsage: this.calculateAverageMemoryUsage(),
        uptime: process.uptime()
      }
    };
  }

  // Calculate average memory usage
  calculateAverageMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    
    const total = this.metrics.memoryUsage.reduce((acc, record) => {
      return acc + (record.heapUsed / 1024 / 1024);
    }, 0);
    
    return (total / this.metrics.memoryUsage.length).toFixed(2);
  }

  // Clean up old metrics
  cleanupOldMetrics() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    this.metrics.performance = this.metrics.performance.filter(
      record => record.timestamp > oneDayAgo
    );
    
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
      record => record.timestamp > oneDayAgo
    );
    
    this.metrics.errors = this.metrics.errors.filter(
      record => record.timestamp > oneDayAgo
    );

    logInfo('🧹 Old metrics cleaned up');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.performanceInterval) clearInterval(this.performanceInterval);
    if (this.memoryInterval) clearInterval(this.memoryInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    
    logInfo('📊 Monitoring system stopped');
  }

  // Get monitoring status
  getStatus() {
    return {
      active: !!(this.performanceInterval && this.memoryInterval && this.cleanupInterval),
      startTime: this.startTime,
      uptime: Date.now() - this.startTime,
      metricsCount: {
        performance: this.metrics.performance.length,
        memory: this.metrics.memoryUsage.length,
        errors: this.metrics.errors.length,
        commands: this.metrics.commands.size
      }
    };
  }
}

module.exports = BotMonitor; 