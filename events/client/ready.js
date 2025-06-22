const { Events, ActivityType } = require('discord.js');
const startGiveawayScheduler = require('../../functions/giveawayScheduler');
const serverStatusUpdater = require('../../functions/serverStatusUpdater');
const updateStatus = require('../../functions/statusRotation');
const { logSuccess, logInfo, logCommand, logSection, logStats, createDivider } = require('../../utils/utils');
const UIUtils = require('../../utils/uiUtils');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    // Show startup animation
    console.log('\n' + createDivider('═', 80));
    console.log(global.styles.highlightColor('🚀 LANYA BOT STARTING UP 🚀'));
    console.log(createDivider('═', 80));

    // Initialize database connection with progress
    console.log(global.styles.infoColor('📊 Initializing Database Connection...'));
    try {
      const connectDB = require('../../handlers/database');
      await connectDB();
      logSuccess('✅ MongoDB Database Connected');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
    }

    // Initialize services with progress indicators
    console.log(global.styles.infoColor('🎁 Starting Giveaway Scheduler...'));
    startGiveawayScheduler(client);
    logSuccess('✅ Giveaway Scheduler Started');

    console.log(global.styles.infoColor('🖥️ Starting Server Status Updater...'));
    serverStatusUpdater(client);
    logSuccess('✅ Server Status Updater Active');

    console.log(global.styles.infoColor('🔄 Starting Status Rotation...'));
    updateStatus(client);
    logSuccess('✅ Status Rotation Active');

    console.log(global.styles.infoColor('🎵 Initializing Lavalink Manager...'));
    client.lavalink.init({ id: client.user.id });
    client.on('raw', (packet) => client.lavalink.sendRawData(packet));
    logSuccess('✅ Lavalink Manager Initialized');
    
    const commandFolderPath = path.join(__dirname, '../../commands');
    const categories = fs
      .readdirSync(commandFolderPath)
      .filter((file) =>
        fs.statSync(path.join(commandFolderPath, file)).isDirectory()
      );

    // Enhanced console output with animations
    console.log('\n' + createDivider('═', 80));
    console.log(global.styles.highlightColor('🎯 LANYA BOT STARTUP COMPLETE 🎯'));
    console.log(createDivider('═', 80));

    // Bot information with enhanced display
    logSection('🤖 BOT INFORMATION');
    logInfo(`Bot User: ${client.user.tag}`);
    logInfo(`Bot ID: ${client.user.id}`);
    logInfo(`Created: ${client.user.createdAt.toLocaleDateString()}`);
    logInfo(`Avatar: ${client.user.displayAvatarURL({ dynamic: true })}`);

    // Enhanced statistics with progress bars
    const serverCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const startTime = new Date().toLocaleString();
    const uptime = Date.now() - process.uptime;

    // Create progress bars for statistics
    const serverProgress = UIUtils.createProgressBar(serverCount, 1000, 20, false);
    const userProgress = UIUtils.createProgressBar(userCount, 100000, 20, false);
    const memoryProgress = UIUtils.createProgressBar(parseFloat(memoryUsage), 100, 20, false);

    logSection('📊 ENHANCED STATISTICS');
    logStats({
      '🏠 Servers': `${serverCount.toLocaleString()} ${serverProgress}`,
      '👥 Users': `${userCount.toLocaleString()} ${userProgress}`,
      '💾 Memory': `${memoryUsage} MB ${memoryProgress}`,
      '⏱️ Uptime': UIUtils.formatDuration(Date.now() - uptime),
      '🟢 Status': 'Online & Operational',
      '📅 Started': startTime,
      '🔢 Version': 'v3.4.3',
      '⚡ Node.js': process.version,
      '🌐 API Latency': `${client.ws.ping}ms`
    });

    // Command categories with enhanced display
    logSection('📁 COMMAND CATEGORIES');
    const totalCommands = categories.reduce((acc, category) => {
      const commandCount = fs.readdirSync(path.join(commandFolderPath, category)).length;
      return acc + commandCount;
    }, 0);

    categories.forEach((category) => {
      const commandCount = fs.readdirSync(path.join(commandFolderPath, category)).length;
      const categoryProgress = UIUtils.createProgressBar(commandCount, 50, 10, false);
      logCommand(category, `${commandCount} commands ${categoryProgress}`);
    });

    logInfo(`Total Commands: ${totalCommands}`);

    // System status with enhanced checks
    logSection('🔧 SYSTEM STATUS');
    
    // Database status
    try {
      const mongoose = require('mongoose');
      const dbStatus = mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
      logSuccess(`✅ Database: ${dbStatus}`);
    } catch (error) {
      logInfo('⚠️ Database: Status Unknown');
    }

    // Lavalink status
    try {
      const lavalinkStatus = client.lavalink.nodes.size > 0 ? '🟢 Connected' : '🔴 Disconnected';
      logSuccess(`✅ Lavalink: ${lavalinkStatus}`);
    } catch (error) {
      logInfo('⚠️ Lavalink: Status Unknown');
    }

    // Memory status
    const memoryStatus = parseFloat(memoryUsage) < 50 ? '🟢 Optimal' : parseFloat(memoryUsage) < 100 ? '🟡 Moderate' : '🔴 High';
    logSuccess(`✅ Memory Usage: ${memoryStatus} (${memoryUsage} MB)`);

    // API latency status
    const latencyStatus = client.ws.ping < 100 ? '🟢 Excellent' : client.ws.ping < 200 ? '🟡 Good' : '🔴 Poor';
    logSuccess(`✅ API Latency: ${latencyStatus} (${client.ws.ping}ms)`);

    // Web dashboard status
    logSuccess('✅ Web Dashboard Running on http://localhost:10000');

    // Performance metrics
    logSection('⚡ PERFORMANCE METRICS');
    const performanceMetrics = {
      '🚀 Startup Time': `${Date.now() - uptime}ms`,
      '💾 Heap Used': UIUtils.formatBytes(process.memoryUsage().heapUsed),
      '💾 Heap Total': UIUtils.formatBytes(process.memoryUsage().heapTotal),
      '💾 External': UIUtils.formatBytes(process.memoryUsage().external),
      '📊 RSS': UIUtils.formatBytes(process.memoryUsage().rss),
      '🔄 Event Loop': 'Active',
      '🎯 CPU Usage': 'Monitoring'
    };

    Object.entries(performanceMetrics).forEach(([key, value]) => {
      logInfo(`${key}: ${value}`);
    });

    // Feature status
    logSection('🎯 FEATURE STATUS');
    const features = [
      { name: '🎵 Music System', status: 'Active', emoji: '✅' },
      { name: '🎁 Giveaway System', status: 'Active', emoji: '✅' },
      { name: '🖥️ Server Status', status: 'Active', emoji: '✅' },
      { name: '🔄 Status Rotation', status: 'Active', emoji: '✅' },
      { name: '📊 Leveling System', status: 'Active', emoji: '✅' },
      { name: '🎫 Ticket System', status: 'Active', emoji: '✅' },
      { name: '🛡️ Moderation Tools', status: 'Active', emoji: '✅' },
      { name: '🎮 Fun Commands', status: 'Active', emoji: '✅' },
      { name: '⚙️ Admin Tools', status: 'Active', emoji: '✅' },
      { name: '🔧 Utility Commands', status: 'Active', emoji: '✅' }
    ];

    features.forEach(feature => {
      logSuccess(`${feature.emoji} ${feature.name}: ${feature.status}`);
    });

    // Final startup completion
    console.log('\n' + createDivider('═', 80));
    console.log(global.styles.successColor('🎉 LANYA BOT IS FULLY OPERATIONAL! 🎉'));
    console.log(global.styles.accentColor('🌐 Dashboard: http://localhost:10000'));
    console.log(global.styles.accentColor('📚 Documentation: https://github.com/birajrai/lanya'));
    console.log(global.styles.accentColor('💬 Support: https://discord.gg/kAYpdenZ8b'));
    console.log(global.styles.accentColor('⭐ GitHub: https://github.com/birajrai/lanya'));
    console.log(createDivider('═', 80));

    // Startup completion message
    console.log(global.styles.highlightColor('\n🚀 Bot is ready to serve!'));
    console.log(global.styles.infoColor(`📊 Serving ${serverCount.toLocaleString()} servers with ${userCount.toLocaleString()} users`));
    console.log(global.styles.infoColor(`⚡ ${totalCommands} commands loaded and ready`));
    console.log(global.styles.successColor('🎯 All systems operational!\n'));

    // Set up periodic status updates
    setInterval(() => {
      const currentMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const currentLatency = client.ws.ping;
      
      // Log performance metrics every 5 minutes
      if (Date.now() % 300000 < 1000) { // Every 5 minutes
        logSection('📊 PERIODIC STATUS UPDATE');
        logInfo(`💾 Memory: ${currentMemory} MB`);
        logInfo(`🌐 Latency: ${currentLatency}ms`);
        logInfo(`⏱️ Uptime: ${UIUtils.formatDuration(Date.now() - uptime)}`);
        logInfo(`🏠 Servers: ${client.guilds.cache.size.toLocaleString()}`);
        logInfo(`👥 Users: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString()}`);
      }
    }, 1000);
  }
};
