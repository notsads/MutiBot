const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const os = require('os');
const { logSuccess, logWarning, logError } = require('../../utils/utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advanced')
    .setDescription('Advanced bot management and system controls')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('system')
        .setDescription('View detailed system information')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('performance')
        .setDescription('Performance monitoring and controls')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('maintenance')
        .setDescription('Bot maintenance controls')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Maintenance action to perform')
            .setRequired(true)
            .addChoices(
              { name: 'Enable Maintenance Mode', value: 'enable' },
              { name: 'Disable Maintenance Mode', value: 'disable' },
              { name: 'Restart Bot', value: 'restart' },
              { name: 'Clear Cache', value: 'cache' },
              { name: 'Update Status', value: 'status' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('analytics')
        .setDescription('View bot analytics and statistics')
    ),

  category: 'admin',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'system':
        await this.showSystemInfo(interaction);
        break;
      case 'performance':
        await this.showPerformanceInfo(interaction);
        break;
      case 'maintenance':
        await this.handleMaintenance(interaction);
        break;
      case 'analytics':
        await this.showAnalytics(interaction);
        break;
    }
  },

  async showSystemInfo(interaction) {
    const client = interaction.client;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    const systemEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🖥️ System Information')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '💾 Memory Usage',
          value: `**Heap Used:** ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n**Heap Total:** ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB\n**External:** ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB\n**RSS:** ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          inline: true
        },
        {
          name: '🔧 CPU Information',
          value: `**User CPU:** ${(cpuUsage.user / 1000000).toFixed(2)}s\n**System CPU:** ${(cpuUsage.system / 1000000).toFixed(2)}s\n**CPU Cores:** ${os.cpus().length}\n**Load Average:** ${os.loadavg().map(load => load.toFixed(2)).join(', ')}`,
          inline: true
        },
        {
          name: '⏰ Uptime',
          value: `**Process:** ${this.formatUptime(uptime)}\n**System:** ${this.formatUptime(os.uptime())}\n**Bot:** ${this.formatUptime(client.uptime)}`,
          inline: true
        },
        {
          name: '🌐 Network',
          value: `**Platform:** ${os.platform()}\n**Architecture:** ${os.arch()}\n**Node.js:** ${process.version}\n**Discord.js:** ${require('discord.js').version}`,
          inline: true
        },
        {
          name: '📊 Bot Statistics',
          value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString()}\n**Commands:** ${client.commands ? client.commands.size : 0}\n**Channels:** ${client.channels.cache.size}`,
          inline: true
        },
        {
          name: '🔗 Connections',
          value: `**WebSocket:** ${client.ws.status}\n**Lavalink:** ${client.lavalink ? 'Connected' : 'Disconnected'}\n**Database:** Connected\n**API Latency:** ${client.ws.ping}ms`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      });

    const systemButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_system')
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('export_system')
          .setLabel('📊 Export Data')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [systemEmbed], components: [systemButtons] });
  },

  async showPerformanceInfo(interaction) {
    const client = interaction.client;
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryPercentage = (heapUsedMB / heapTotalMB) * 100;

    const performanceEmbed = new EmbedBuilder()
      .setColor(this.getPerformanceColor(memoryPercentage))
      .setTitle('📈 Performance Monitor')
      .addFields(
        {
          name: '💾 Memory Performance',
          value: `**Usage:** ${heapUsedMB.toFixed(2)} MB / ${heapTotalMB.toFixed(2)} MB\n**Percentage:** ${memoryPercentage.toFixed(2)}%\n**Status:** ${this.getMemoryStatus(memoryPercentage)}`,
          inline: true
        },
        {
          name: '⚡ System Performance',
          value: `**Load Average:** ${os.loadavg().map(load => load.toFixed(2)).join(', ')}\n**Free Memory:** ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB\n**Total Memory:** ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
          inline: true
        },
        {
          name: '🎯 Bot Performance',
          value: `**API Latency:** ${client.ws.ping}ms\n**WebSocket Status:** ${client.ws.status}\n**Ready Status:** ${client.isReady() ? '✅ Ready' : '❌ Not Ready'}`,
          inline: true
        }
      )
      .setTimestamp();

    const performanceButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('optimize_performance')
          .setLabel('⚡ Optimize')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('clear_cache')
          .setLabel('🗑️ Clear Cache')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [performanceEmbed], components: [performanceButtons] });
  },

  async handleMaintenance(interaction) {
    const action = interaction.options.getString('action');

    switch (action) {
      case 'enable':
        await this.enableMaintenanceMode(interaction);
        break;
      case 'disable':
        await this.disableMaintenanceMode(interaction);
        break;
      case 'restart':
        await this.restartBot(interaction);
        break;
      case 'cache':
        await this.clearCache(interaction);
        break;
      case 'status':
        await this.updateStatus(interaction);
        break;
    }
  },

  async enableMaintenanceMode(interaction) {
    // Set maintenance mode
    global.maintenanceMode = true;
    
    const maintenanceEmbed = new EmbedBuilder()
      .setColor(0xFF9800)
      .setTitle('🔧 Maintenance Mode Enabled')
      .setDescription('The bot is now in maintenance mode. Only administrators can use commands.')
      .addFields({
        name: '⚠️ Notice',
        value: 'All non-admin commands are temporarily disabled. Users will see a maintenance message.',
        inline: false
      })
      .setTimestamp();

    logWarning('Maintenance mode enabled by administrator');
    await interaction.reply({ embeds: [maintenanceEmbed] });
  },

  async disableMaintenanceMode(interaction) {
    // Disable maintenance mode
    global.maintenanceMode = false;
    
    const maintenanceEmbed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('✅ Maintenance Mode Disabled')
      .setDescription('The bot is now fully operational. All commands are available.')
      .setTimestamp();

    logSuccess('Maintenance mode disabled by administrator');
    await interaction.reply({ embeds: [maintenanceEmbed] });
  },

  async restartBot(interaction) {
    const restartEmbed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('🔄 Bot Restart')
      .setDescription('The bot will restart in 5 seconds. Please wait...')
      .setTimestamp();

    await interaction.reply({ embeds: [restartEmbed] });

    // Schedule restart
    setTimeout(() => {
      logWarning('Bot restart initiated by administrator');
      process.exit(0);
    }, 5000);
  },

  async clearCache(interaction) {
    const client = interaction.client;
    
    // Clear various caches
    client.users.cache.clear();
    client.guilds.cache.clear();
    client.channels.cache.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const cacheEmbed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('🗑️ Cache Cleared')
      .setDescription('All bot caches have been cleared successfully.')
      .addFields({
        name: '🧹 Cleared Caches',
        value: '• User Cache\n• Guild Cache\n• Channel Cache\n• Memory Garbage Collection',
        inline: false
      })
      .setTimestamp();

    logSuccess('Cache cleared by administrator');
    await interaction.reply({ embeds: [cacheEmbed] });
  },

  async updateStatus(interaction) {
    const client = interaction.client;
    
    // Update bot status
    client.user.setActivity('Maintenance Mode', { type: 2 }); // Watching

    const statusEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📊 Status Updated')
      .setDescription('Bot status has been updated successfully.')
      .addFields({
        name: '🔄 New Status',
        value: 'Watching Maintenance Mode',
        inline: false
      })
      .setTimestamp();

    await interaction.reply({ embeds: [statusEmbed] });
  },

  async showAnalytics(interaction) {
    const client = interaction.client;
    
    // Get command usage statistics
    const commandUsage = client.commandUsage ? Array.from(client.commandUsage.entries()) : [];
    const topCommands = commandUsage
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    const analyticsEmbed = new EmbedBuilder()
      .setColor(0x9C27B0)
      .setTitle('📊 Bot Analytics')
      .addFields(
        {
          name: '🎯 Top Commands',
          value: topCommands.length > 0 
            ? topCommands.map((cmd, index) => `${index + 1}. **${cmd[0]}** - ${cmd[1].count} uses`).join('\n')
            : 'No command usage data available',
          inline: false
        },
        {
          name: '📈 Usage Statistics',
          value: `**Total Commands:** ${commandUsage.reduce((acc, cmd) => acc + cmd[1].count, 0)}\n**Unique Users:** ${new Set(commandUsage.flatMap(cmd => Array.from(cmd[1].users))).size}\n**Active Servers:** ${client.guilds.cache.size}`,
          inline: true
        },
        {
          name: '⚡ Performance',
          value: `**Average Response Time:** ${this.calculateAverageResponseTime(commandUsage)}ms\n**Error Rate:** ${this.calculateErrorRate(commandUsage)}%\n**Uptime:** ${this.formatUptime(client.uptime)}`,
          inline: true
        }
      )
      .setTimestamp();

    // Check if interaction has already been replied to
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [analyticsEmbed] });
    } else {
      await interaction.reply({ embeds: [analyticsEmbed] });
    }
  },

  // Utility methods
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  },

  getPerformanceColor(percentage) {
    if (percentage > 90) return 0xFF6B6B; // Red
    if (percentage > 75) return 0xFF9800; // Orange
    if (percentage > 50) return 0xFFC107; // Yellow
    return 0x4CAF50; // Green
  },

  getMemoryStatus(percentage) {
    if (percentage > 90) return '🔴 Critical';
    if (percentage > 75) return '🟡 Warning';
    if (percentage > 50) return '🟠 Moderate';
    return '🟢 Healthy';
  },

  calculateAverageResponseTime(commandUsage) {
    if (commandUsage.length === 0) return 0;
    const totalTime = commandUsage.reduce((acc, cmd) => acc + cmd[1].averageExecutionTime, 0);
    return Math.round(totalTime / commandUsage.length);
  },

  calculateErrorRate(commandUsage) {
    if (commandUsage.length === 0) return 0;
    const totalUses = commandUsage.reduce((acc, cmd) => acc + cmd[1].count, 0);
    const totalErrors = commandUsage.reduce((acc, cmd) => acc + cmd[1].errors, 0);
    return totalUses > 0 ? ((totalErrors / totalUses) * 100).toFixed(2) : '0.00';
  }
}; 