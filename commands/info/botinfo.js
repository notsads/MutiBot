const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const moment = require('moment');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription("Displays the bot's information and statistics.")
    .addBooleanOption((option) =>
      option
        .setName('detailed')
        .setDescription('Show detailed system information')
    ),

  async execute(interaction) {
    const client = interaction.client;
    const showDetailed = interaction.options.getBoolean('detailed') || false;
    
    const totalGuilds = client.guilds.cache.size;
    const totalMembers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );

    const uptime = moment.duration(process.uptime(), 'seconds').humanize();
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const cpuModel = os.cpus()[0].model;
    const operatingSystem = `${os.type()} ${os.release()}`;

    // Get performance status
    const performanceStatus = this.getPerformanceStatus(memoryUsage, cpuUsagePercent);
    const healthStatus = this.getHealthStatus(client);

    const botInfoEmbed = new EmbedBuilder()
      .setColor(performanceStatus.color)
      .setTitle(`🤖 ${client.user.username} - Bot Information`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription('```ml\nAdvanced Discord Bot with 100+ Features\n```')
      .addFields(
        {
          name: '👨‍💻 Developer',
          value: '```elm\nNeppixel\n```',
          inline: true,
        },
        {
          name: '🌍 Servers',
          value: `\`\`\`elm\n${totalGuilds.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: '👥 Users',
          value: `\`\`\`elm\n${totalMembers.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: '⏱️ Uptime',
          value: `\`\`\`elm\n${uptime}\`\`\``,
          inline: true,
        },
        {
          name: '🔧 CPU Usage',
          value: `\`\`\`elm\n${cpuUsagePercent}%\`\`\``,
          inline: true,
        },
        {
          name: '💾 RAM Usage',
          value: `\`\`\`elm\n${memoryUsage} MB / ${totalMemory} GB\`\`\``,
          inline: true,
        },
        {
          name: '📊 Performance',
          value: `**Status:** ${performanceStatus.status}\n**API Latency:** ${client.ws.ping}ms\n**Health:** ${healthStatus}`,
          inline: true,
        },
        {
          name: '📅 Created On',
          value: `\`\`\`elm\n${moment(client.user.createdAt).format('MMMM Do YYYY, h:mm:ss A')}\`\`\``,
          inline: true,
        },
        {
          name: '📚 Library',
          value: '```elm\ndiscord.js v14\n```',
          inline: true,
        },
        {
          name: '🔗 Version',
          value: '```elm\nv3.4.3\n```',
          inline: true,
        },
        {
          name: '🎵 Lavalink',
          value: '```elm\nConnected\n```',
          inline: true,
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Requested by ${interaction.user.tag}`,
        iconURL: interaction.guild.iconURL({ dynamic: true }) || interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setImage('https://i.imgur.com/8tBXd6H.gif');

    // Add detailed system information if requested
    if (showDetailed) {
      botInfoEmbed.addFields(
        {
          name: '🖥️ System Details',
          value: `**CPU Model:** ${cpuModel}\n**OS:** ${operatingSystem}\n**Architecture:** ${os.arch()}\n**Platform:** ${os.platform()}`,
          inline: false
        },
        {
          name: '📈 System Stats',
          value: `**Load Average:** ${os.loadavg().map(load => load.toFixed(2)).join(', ')}\n**Free Memory:** ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB\n**CPU Cores:** ${os.cpus().length}`,
          inline: false
        }
      );
    }

    const sourceCodeButton = new ButtonBuilder()
      .setLabel('📚 Source Code')
      .setURL('https://github.com/birajrai/lanya')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🔗');

    const supportButton = new ButtonBuilder()
      .setLabel('💬 Support Server')
      .setURL('https://discord.gg/kAYpdenZ8b')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🆘');

    const inviteButton = new ButtonBuilder()
      .setLabel('➕ Invite Bot')
      .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
      .setStyle(ButtonStyle.Link)
      .setEmoji('🎯');

    const refreshButton = new ButtonBuilder()
      .setCustomId('refresh_botinfo')
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄');

    const detailedButton = new ButtonBuilder()
      .setCustomId('toggle_detailed')
      .setLabel(showDetailed ? '📋 Hide Details' : '📋 Show Details')
      .setStyle(showDetailed ? ButtonStyle.Danger : ButtonStyle.Success)
      .setEmoji(showDetailed ? '📋' : '📋');

    const row1 = new ActionRowBuilder().addComponents(
      sourceCodeButton,
      supportButton,
      inviteButton
    );

    const row2 = new ActionRowBuilder().addComponents(
      refreshButton,
      detailedButton
    );

    const response = await interaction.reply({ 
      embeds: [botInfoEmbed], 
      components: [row1, row2],
      fetchReply: true 
    });

    // Create collector for interactive buttons
    const filter = (i) => 
      (i.customId === 'refresh_botinfo' || i.customId === 'toggle_detailed') && 
      i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });

    let currentDetailed = showDetailed;

    collector.on('collect', async (i) => {
      if (i.customId === 'refresh_botinfo') {
        // Refresh the bot info
        const refreshedEmbed = await this.createBotInfoEmbed(client, interaction, currentDetailed);
        await i.update({ embeds: [refreshedEmbed] });
      } else if (i.customId === 'toggle_detailed') {
        currentDetailed = !currentDetailed;
        const toggledEmbed = await this.createBotInfoEmbed(client, interaction, currentDetailed);
        
        // Update the detailed button
        const updatedRow2 = new ActionRowBuilder().addComponents(
          refreshButton,
          new ButtonBuilder()
            .setCustomId('toggle_detailed')
            .setLabel(currentDetailed ? '📋 Hide Details' : '📋 Show Details')
            .setStyle(currentDetailed ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('📋')
        );

        await i.update({ 
          embeds: [toggledEmbed], 
          components: [row1, updatedRow2] 
        });
      }
    });

    collector.on('end', () => {
      // Disable buttons when collector expires
      const disabledRow2 = new ActionRowBuilder().addComponents(
        refreshButton.setDisabled(true),
        detailedButton.setDisabled(true)
      );
      interaction.editReply({ components: [row1, disabledRow2] }).catch(() => {});
    });
  },

  async createBotInfoEmbed(client, interaction, showDetailed) {
    const totalGuilds = client.guilds.cache.size;
    const totalMembers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );

    const uptime = moment.duration(process.uptime(), 'seconds').humanize();
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const cpuModel = os.cpus()[0].model;
    const operatingSystem = `${os.type()} ${os.release()}`;

    const performanceStatus = this.getPerformanceStatus(memoryUsage, cpuUsagePercent);
    const healthStatus = this.getHealthStatus(client);

    const embed = new EmbedBuilder()
      .setColor(performanceStatus.color)
      .setTitle(`🤖 ${client.user.username} - Bot Information`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription('```ml\nAdvanced Discord Bot with 100+ Features\n```')
      .addFields(
        {
          name: '👨‍💻 Developer',
          value: '```elm\nNeppixel\n```',
          inline: true,
        },
        {
          name: '🌍 Servers',
          value: `\`\`\`elm\n${totalGuilds.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: '👥 Users',
          value: `\`\`\`elm\n${totalMembers.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: '⏱️ Uptime',
          value: `\`\`\`elm\n${uptime}\`\`\``,
          inline: true,
        },
        {
          name: '🔧 CPU Usage',
          value: `\`\`\`elm\n${cpuUsagePercent}%\`\`\``,
          inline: true,
        },
        {
          name: '💾 RAM Usage',
          value: `\`\`\`elm\n${memoryUsage} MB / ${totalMemory} GB\`\`\``,
          inline: true,
        },
        {
          name: '📊 Performance',
          value: `**Status:** ${performanceStatus.status}\n**API Latency:** ${client.ws.ping}ms\n**Health:** ${healthStatus}`,
          inline: true,
        },
        {
          name: '📅 Created On',
          value: `\`\`\`elm\n${moment(client.user.createdAt).format('MMMM Do YYYY, h:mm:ss A')}\`\`\``,
          inline: true,
        },
        {
          name: '📚 Library',
          value: '```elm\ndiscord.js v14\n```',
          inline: true,
        },
        {
          name: '🔗 Version',
          value: '```elm\nv3.4.3\n```',
          inline: true,
        },
        {
          name: '🎵 Lavalink',
          value: '```elm\nConnected\n```',
          inline: true,
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Requested by ${interaction.user.tag}`,
        iconURL: interaction.guild.iconURL({ dynamic: true }) || interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setImage('https://i.imgur.com/8tBXd6H.gif');

    if (showDetailed) {
      embed.addFields(
        {
          name: '🖥️ System Details',
          value: `**CPU Model:** ${cpuModel}\n**OS:** ${operatingSystem}\n**Architecture:** ${os.arch()}\n**Platform:** ${os.platform()}`,
          inline: false
        },
        {
          name: '📈 System Stats',
          value: `**Load Average:** ${os.loadavg().map(load => load.toFixed(2)).join(', ')}\n**Free Memory:** ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB\n**CPU Cores:** ${os.cpus().length}`,
          inline: false
        }
      );
    }

    return embed;
  },

  getPerformanceStatus(memoryUsage, cpuUsage) {
    const memoryPercent = (memoryUsage / 1024) * 100; // Assuming 1GB as baseline
    
    if (memoryPercent > 80 || cpuUsage > 80) {
      return { status: '🔴 Critical', color: 0xFF6B6B };
    } else if (memoryPercent > 60 || cpuUsage > 60) {
      return { status: '🟡 Warning', color: 0xFF9800 };
    } else if (memoryPercent > 40 || cpuUsage > 40) {
      return { status: '🟠 Moderate', color: 0xFFC107 };
    } else {
      return { status: '🟢 Healthy', color: 0x4CAF50 };
    }
  },

  getHealthStatus(client) {
    const ping = client.ws.ping;
    const isReady = client.isReady();
    
    if (!isReady) return '🔴 Offline';
    if (ping > 500) return '🟡 High Latency';
    if (ping > 200) return '🟠 Moderate Latency';
    return '🟢 Excellent';
  }
};
