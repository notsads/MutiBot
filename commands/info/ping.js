const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Displays the bot's API and client ping.")
    .addBooleanOption((option) =>
      option
        .setName('detailed')
        .setDescription('Show detailed latency information')
    ),

  async execute(interaction) {
    const showDetailed = interaction.options.getBoolean('detailed') || false;
    
    // Show loading state
    const loadingEmbed = UIUtils.createAnimatedEmbed(
      '🏓 Measuring Latency',
      'Calculating ping times and performance metrics...',
      UIUtils.colors.info,
      'loading'
    );
    
    await interaction.reply({ embeds: [loadingEmbed], fetchReply: true });
    
    // Get initial ping measurements
    const initialApiPing = Math.round(interaction.client.ws.ping);
    const sent = await interaction.channel.send({ content: 'Ping test' });
    const clientPing = sent.createdTimestamp - Date.now();
    await sent.delete();

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(initialApiPing, clientPing);
    
    const pingEmbed = UIUtils.createAnimatedEmbed(
      '🏓 Pong!',
      `**Latency information for ${interaction.client.user.username}:**`,
      performanceMetrics.color,
      performanceMetrics.status.toLowerCase(),
      [
        {
          name: '📡 API Latency',
          value: `\`${initialApiPing}ms\` ${performanceMetrics.apiIcon}`,
          inline: true,
        },
        {
          name: '⏱️ Client Latency',
          value: `\`${clientPing}ms\` ${performanceMetrics.clientIcon}`,
          inline: true,
        },
        {
          name: '📊 Performance',
          value: `**Status:** ${performanceMetrics.status}\n**Quality:** ${performanceMetrics.quality}`,
          inline: true,
        }
      ],
      {
        text: `${interaction.guild.name} • Requested by ${interaction.user.tag}`,
        iconURL: interaction.guild.iconURL({ dynamic: true }) || interaction.user.displayAvatarURL({ dynamic: true }),
      },
      interaction.client.user.displayAvatarURL({ dynamic: true })
    );

    // Add progress bar for latency visualization
    const maxLatency = 1000; // 1 second max
    const apiProgress = UIUtils.createProgressBar(initialApiPing, maxLatency, 15, false);
    const clientProgress = UIUtils.createProgressBar(clientPing, maxLatency, 15, false);
    
    pingEmbed.addFields({
      name: '📈 Latency Visualization',
      value: `**API:** ${apiProgress}\n**Client:** ${clientProgress}`,
      inline: false
    });

    // Add detailed information if requested
    if (showDetailed) {
      const detailedInfo = this.getDetailedLatencyInfo(interaction.client);
      pingEmbed.addFields(
        {
          name: '🔍 Detailed Analysis',
          value: detailedInfo.analysis,
          inline: false
        },
        {
          name: '📈 Network Stats',
          value: detailedInfo.network,
          inline: true
        },
        {
          name: '⚡ Connection Info',
          value: detailedInfo.connection,
          inline: true
        }
      );
    }

    // Interactive buttons
    const actionButtons = UIUtils.createActionButtons([
      {
        id: 'refresh_ping',
        label: 'Refresh',
        emoji: '🔄',
        style: 'primary'
      },
      {
        id: 'toggle_detailed_ping',
        label: showDetailed ? 'Hide Details' : 'Show Details',
        emoji: '📋',
        style: showDetailed ? 'danger' : 'success'
      },
      {
        id: 'show_ping_graph',
        label: 'Show Graph',
        emoji: '📊',
        style: 'secondary'
      },
      {
        id: 'ping_history',
        label: 'History',
        emoji: '📜',
        style: 'secondary'
      }
    ]);

    const response = await interaction.editReply({ 
      embeds: [pingEmbed], 
      components: [actionButtons] 
    });

    // Create collector for interactive buttons
    const filter = (i) => 
      (i.customId === 'refresh_ping' || 
       i.customId === 'toggle_detailed_ping' || 
       i.customId === 'show_ping_graph' ||
       i.customId === 'ping_history') && 
      i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });

    let currentDetailed = showDetailed;
    let pingHistory = [{ api: initialApiPing, client: clientPing, timestamp: Date.now() }];

    collector.on('collect', async (i) => {
      if (i.customId === 'refresh_ping') {
        // Show loading state
        const refreshLoadingEmbed = UIUtils.createAnimatedEmbed(
          '🔄 Refreshing Ping',
          'Measuring updated latency...',
          UIUtils.colors.info,
          'loading'
        );
        
        await i.update({ 
          embeds: [refreshLoadingEmbed],
          components: []
        });

        // Get fresh ping measurements
        const newApiPing = Math.round(interaction.client.ws.ping);
        const newSent = await interaction.channel.send({ content: 'Ping test' });
        const newClientPing = newSent.createdTimestamp - Date.now();
        await newSent.delete();

        // Add to history
        pingHistory.push({ api: newApiPing, client: newClientPing, timestamp: Date.now() });
        if (pingHistory.length > 10) pingHistory.shift(); // Keep last 10 measurements

        const newPerformanceMetrics = this.calculatePerformanceMetrics(newApiPing, newClientPing);
        
        const refreshedEmbed = UIUtils.createAnimatedEmbed(
          '🏓 Pong! (Refreshed)',
          `**Updated latency information for ${interaction.client.user.username}:**`,
          newPerformanceMetrics.color,
          newPerformanceMetrics.status.toLowerCase(),
          [
            {
              name: '📡 API Latency',
              value: `\`${newApiPing}ms\` ${newPerformanceMetrics.apiIcon}`,
              inline: true,
            },
            {
              name: '⏱️ Client Latency',
              value: `\`${newClientPing}ms\` ${newPerformanceMetrics.clientIcon}`,
              inline: true,
            },
            {
              name: '📊 Performance',
              value: `**Status:** ${newPerformanceMetrics.status}\n**Quality:** ${newPerformanceMetrics.quality}`,
              inline: true,
            }
          ],
          {
            text: `${interaction.guild.name} • Refreshed by ${interaction.user.tag}`,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || interaction.user.displayAvatarURL({ dynamic: true }),
          },
          interaction.client.user.displayAvatarURL({ dynamic: true })
        );

        // Add updated progress bars
        const maxLatency = 1000;
        const newApiProgress = UIUtils.createProgressBar(newApiPing, maxLatency, 15, false);
        const newClientProgress = UIUtils.createProgressBar(newClientPing, maxLatency, 15, false);
        
        refreshedEmbed.addFields({
          name: '📈 Latency Visualization',
          value: `**API:** ${newApiProgress}\n**Client:** ${newClientProgress}`,
          inline: false
        });

        if (currentDetailed) {
          const detailedInfo = this.getDetailedLatencyInfo(interaction.client);
          refreshedEmbed.addFields(
            {
              name: '🔍 Detailed Analysis',
              value: detailedInfo.analysis,
              inline: false
            },
            {
              name: '📈 Network Stats',
              value: detailedInfo.network,
              inline: true
            },
            {
              name: '⚡ Connection Info',
              value: detailedInfo.connection,
              inline: true
            }
          );
        }

        const updatedButtons = UIUtils.createActionButtons([
          {
            id: 'refresh_ping',
            label: 'Refresh',
            emoji: '🔄',
            style: 'primary'
          },
          {
            id: 'toggle_detailed_ping',
            label: currentDetailed ? 'Hide Details' : 'Show Details',
            emoji: '📋',
            style: currentDetailed ? 'danger' : 'success'
          },
          {
            id: 'show_ping_graph',
            label: 'Show Graph',
            emoji: '📊',
            style: 'secondary'
          },
          {
            id: 'ping_history',
            label: 'History',
            emoji: '📜',
            style: 'secondary'
          }
        ]);

        await i.update({ 
          embeds: [refreshedEmbed], 
          components: [updatedButtons] 
        });

      } else if (i.customId === 'toggle_detailed_ping') {
        currentDetailed = !currentDetailed;
        
        const toggledEmbed = UIUtils.createAnimatedEmbed(
          '🏓 Pong!',
          `**Latency information for ${interaction.client.user.username}:**`,
          performanceMetrics.color,
          performanceMetrics.status.toLowerCase(),
          [
            {
              name: '📡 API Latency',
              value: `\`${initialApiPing}ms\` ${performanceMetrics.apiIcon}`,
              inline: true,
            },
            {
              name: '⏱️ Client Latency',
              value: `\`${clientPing}ms\` ${performanceMetrics.clientIcon}`,
              inline: true,
            },
            {
              name: '📊 Performance',
              value: `**Status:** ${performanceMetrics.status}\n**Quality:** ${performanceMetrics.quality}`,
              inline: true,
            }
          ],
          {
            text: `${interaction.guild.name} • Requested by ${interaction.user.tag}`,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || interaction.user.displayAvatarURL({ dynamic: true }),
          },
          interaction.client.user.displayAvatarURL({ dynamic: true })
        );

        // Add progress bars
        const maxLatency = 1000;
        const apiProgress = UIUtils.createProgressBar(initialApiPing, maxLatency, 15, false);
        const clientProgress = UIUtils.createProgressBar(clientPing, maxLatency, 15, false);
        
        toggledEmbed.addFields({
          name: '📈 Latency Visualization',
          value: `**API:** ${apiProgress}\n**Client:** ${clientProgress}`,
          inline: false
        });

        if (currentDetailed) {
          const detailedInfo = this.getDetailedLatencyInfo(interaction.client);
          toggledEmbed.addFields(
            {
              name: '🔍 Detailed Analysis',
              value: detailedInfo.analysis,
              inline: false
            },
            {
              name: '📈 Network Stats',
              value: detailedInfo.network,
              inline: true
            },
            {
              name: '⚡ Connection Info',
              value: detailedInfo.connection,
              inline: true
            }
          );
        }

        const updatedButtons = UIUtils.createActionButtons([
          {
            id: 'refresh_ping',
            label: 'Refresh',
            emoji: '🔄',
            style: 'primary'
          },
          {
            id: 'toggle_detailed_ping',
            label: currentDetailed ? 'Hide Details' : 'Show Details',
            emoji: '📋',
            style: currentDetailed ? 'danger' : 'success'
          },
          {
            id: 'show_ping_graph',
            label: 'Show Graph',
            emoji: '📊',
            style: 'secondary'
          },
          {
            id: 'ping_history',
            label: 'History',
            emoji: '📜',
            style: 'secondary'
          }
        ]);

        await i.update({ 
          embeds: [toggledEmbed], 
          components: [updatedButtons] 
        });

      } else if (i.customId === 'show_ping_graph') {
        const graphEmbed = this.createPingGraphEmbed(pingHistory, interaction);
        const backButton = UIUtils.createActionButtons([
          {
            id: 'back_to_ping',
            label: 'Back to Ping',
            emoji: '🔙',
            style: 'secondary'
          }
        ]);

        await i.update({ 
          embeds: [graphEmbed], 
          components: [backButton] 
        });

      } else if (i.customId === 'ping_history') {
        const historyEmbed = this.createPingHistoryEmbed(pingHistory, interaction);
        const backButton = UIUtils.createActionButtons([
          {
            id: 'back_to_ping',
            label: 'Back to Ping',
            emoji: '🔙',
            style: 'secondary'
          }
        ]);

        await i.update({ 
          embeds: [historyEmbed], 
          components: [backButton] 
        });

      } else if (i.customId === 'back_to_ping') {
        await i.update({ 
          embeds: [pingEmbed], 
          components: [actionButtons] 
        });
      }
    });

    collector.on('end', () => {
      // Disable all buttons when collector expires
      const disabledButtons = UIUtils.createActionButtons([
        {
          id: 'refresh_ping',
          label: 'Refresh',
          emoji: '🔄',
          style: 'primary',
          disabled: true
        },
        {
          id: 'toggle_detailed_ping',
          label: currentDetailed ? 'Hide Details' : 'Show Details',
          emoji: '📋',
          style: currentDetailed ? 'danger' : 'success',
          disabled: true
        },
        {
          id: 'show_ping_graph',
          label: 'Show Graph',
          emoji: '📊',
          style: 'secondary',
          disabled: true
        },
        {
          id: 'ping_history',
          label: 'History',
          emoji: '📜',
          style: 'secondary',
          disabled: true
        }
      ]);
      
      interaction.editReply({
        components: [disabledButtons],
      }).catch(() => {});
    });
  },

  createPingGraphEmbed(pingHistory, interaction) {
    const graphEmbed = UIUtils.createAnimatedEmbed(
      '📊 Ping Graph',
      'Visual representation of recent ping measurements',
      UIUtils.colors.info,
      'info',
      [
        {
          name: '📈 API Latency Trend',
          value: this.createTrendGraph(pingHistory.map(p => p.api), 'API'),
          inline: false
        },
        {
          name: '⏱️ Client Latency Trend',
          value: this.createTrendGraph(pingHistory.map(p => p.client), 'Client'),
          inline: false
        }
      ],
      {
        text: `Ping history for ${interaction.client.user.username}`,
        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
      }
    );

    return graphEmbed;
  },

  createPingHistoryEmbed(pingHistory, interaction) {
    const historyText = pingHistory.map((ping, index) => {
      const timeAgo = UIUtils.createRelativeTimestamp(new Date(ping.timestamp));
      return `**${pingHistory.length - index}.** API: \`${ping.api}ms\` | Client: \`${ping.client}ms\` • ${timeAgo}`;
    }).join('\n');

    const historyEmbed = UIUtils.createAnimatedEmbed(
      '📜 Ping History',
      'Recent ping measurements and their timestamps',
      UIUtils.colors.secondary,
      'info',
      [
        {
          name: '📊 Recent Measurements',
          value: historyText || 'No history available',
          inline: false
        },
        {
          name: '📈 Statistics',
          value: this.calculateHistoryStats(pingHistory),
          inline: true
        }
      ],
      {
        text: `Last ${pingHistory.length} measurements`,
        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
      }
    );

    return historyEmbed;
  },

  createTrendGraph(values, type) {
    if (values.length < 2) return 'Not enough data for graph';
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const bars = values.map(value => {
      const height = Math.round(((value - min) / range) * 5);
      return '█'.repeat(height) + '░'.repeat(5 - height);
    });
    
    return bars.join('\n') + `\n**${type}:** ${values[values.length - 1]}ms (Latest)`;
  },

  calculateHistoryStats(pingHistory) {
    if (pingHistory.length === 0) return 'No data';
    
    const apiValues = pingHistory.map(p => p.api);
    const clientValues = pingHistory.map(p => p.client);
    
    const avgApi = Math.round(apiValues.reduce((a, b) => a + b, 0) / apiValues.length);
    const avgClient = Math.round(clientValues.reduce((a, b) => a + b, 0) / clientValues.length);
    const minApi = Math.min(...apiValues);
    const maxApi = Math.max(...apiValues);
    const minClient = Math.min(...clientValues);
    const maxClient = Math.max(...clientValues);
    
    return `**API:** Avg: ${avgApi}ms | Min: ${minApi}ms | Max: ${maxApi}ms\n**Client:** Avg: ${avgClient}ms | Min: ${minClient}ms | Max: ${maxClient}ms`;
  },

  calculatePerformanceMetrics(apiPing, clientPing) {
    const totalLatency = apiPing + clientPing;
    
    let color, status, quality, apiIcon, clientIcon;
    
    if (totalLatency < 100) {
      color = UIUtils.colors.success;
      status = 'Excellent';
      quality = 'Very Fast';
      apiIcon = '🟢';
      clientIcon = '🟢';
    } else if (totalLatency < 200) {
      color = UIUtils.colors.primary;
      status = 'Good';
      quality = 'Fast';
      apiIcon = '🟡';
      clientIcon = '🟡';
    } else if (totalLatency < 400) {
      color = UIUtils.colors.warning;
      status = 'Fair';
      quality = 'Moderate';
      apiIcon = '🟠';
      clientIcon = '🟠';
    } else {
      color = UIUtils.colors.error;
      status = 'Poor';
      quality = 'Slow';
      apiIcon = '🔴';
      clientIcon = '🔴';
    }
    
    return { color, status, quality, apiIcon, clientIcon };
  },

  getDetailedLatencyInfo(client) {
    const uptime = this.formatUptime(client.uptime);
    const memory = UIUtils.formatBytes(process.memoryUsage().heapUsed);
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    
    return {
      analysis: `**Connection Quality:** ${client.ws.ping < 100 ? 'Excellent' : client.ws.ping < 200 ? 'Good' : client.ws.ping < 400 ? 'Fair' : 'Poor'}\n**Shard Status:** ${client.shard ? 'Multi-shard' : 'Single shard'}\n**Gateway:** ${client.ws.status}`,
      network: `**Uptime:** ${uptime}\n**Memory:** ${memory}\n**Guilds:** ${guilds.toLocaleString()}\n**Users:** ${users.toLocaleString()}`,
      connection: `**Shards:** ${client.shard ? client.shard.count : 1}\n**Status:** ${client.ws.status}\n**Ping:** ${client.ws.ping}ms`
    };
  },

  formatUptime(ms) {
    return UIUtils.formatDuration(ms);
  },
};
