const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const Fuse = require('fuse.js');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(
      'Displays a list of commands or detailed info about a specific command.'
    )
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('Get detailed info about a specific command')
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('search')
        .setDescription('Search for commands using keywords')
    )
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('Show help message only to you (ephemeral)')
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().trim();
    const commandNames = [...interaction.client.commands.keys()];

    const filtered = commandNames
      .filter((name) => name.startsWith(focusedValue))
      .slice(0, 10)
      .map((name) => ({ name, value: name }));

    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const { client } = interaction;
    const commandName = interaction.options.getString('command');
    const searchQuery = interaction.options.getString('search');
    const isPrivate = interaction.options.getBoolean('private') || false;
    
    // Enhanced category display names, emojis, and descriptions
    const categoryMap = {
      admin: { 
        name: 'Administration', 
        emoji: '⚙️', 
        color: UIUtils.colors.error,
        description: 'Server management and administrative tools',
        icon: '🔧',
        commands: []
      },
      fun: { 
        name: 'Fun & Games', 
        emoji: '🎉', 
        color: UIUtils.colors.primary,
        description: 'Entertainment and interactive features',
        icon: '🎮',
        commands: []
      },
      level: { 
        name: 'Leveling', 
        emoji: '🎮', 
        color: UIUtils.colors.info,
        description: 'XP system and user progression',
        icon: '📈',
        commands: []
      },
      music: { 
        name: 'Music', 
        emoji: '🎵', 
        color: UIUtils.colors.success,
        description: 'Music playback and audio controls',
        icon: '🎧',
        commands: []
      },
      moderation: { 
        name: 'Moderation', 
        emoji: '🔨', 
        color: UIUtils.colors.warning,
        description: 'Server moderation and safety tools',
        icon: '🛡️',
        commands: []
      },
      utility: { 
        name: 'Utility', 
        emoji: '🪛', 
        color: UIUtils.colors.purple,
        description: 'Helpful tools and utilities',
        icon: '🔧',
        commands: []
      },
      minecraft: { 
        name: 'Minecraft', 
        emoji: '🟩', 
        color: 0x90EE90,
        description: 'Minecraft server integration',
        icon: '⛏️',
        commands: []
      },
      info: { 
        name: 'Information', 
        emoji: 'ℹ️', 
        color: UIUtils.colors.secondary,
        description: 'Information and statistics',
        icon: '📊',
        commands: []
      },
      tickets: { 
        name: 'Tickets', 
        emoji: '🎫', 
        color: 0xFFB6C1,
        description: 'Support ticket system',
        icon: '🎫',
        commands: []
      },
    };

    // Get live stats
    const liveStats = this.getLiveStats(client);
    
    // Enhanced fuzzy search logic
    if (searchQuery) {
      const fuse = new Fuse([...client.commands.values()], {
        keys: ['data.name', 'data.description'],
        threshold: 0.4,
      });
      const results = fuse.search(searchQuery);
      if (!results.length) {
        const noResultsEmbed = UIUtils.createErrorEmbed(
          new Error(`No commands found matching "${searchQuery}"`),
          '🔍 Search Results',
          [
            'Try using different keywords',
            'Check spelling',
            'Use `/help` to see all commands'
          ]
        );
        noResultsEmbed.setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });
        return interaction.reply({ embeds: [noResultsEmbed], ephemeral: isPrivate });
      }
      
      const embed = UIUtils.createAnimatedEmbed(
        `Search Results for "${searchQuery}"`,
        results
          .slice(0, 10)
          .map(
            (r, i) =>
              `**${i + 1}.** \`/${r.item.data.name}\` - ${r.item.data.description || 'No description.'}`
          )
          .join('\n'),
        UIUtils.colors.primary,
        'info',
        [{
          name: '📊 Results',
          value: `Found **${results.length}** command(s)`,
          inline: true
        }],
        {
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        }
      );
      return interaction.reply({ embeds: [embed], ephemeral: isPrivate });
    }

    if (commandName) {
      const command = client.commands.get(commandName);
      if (!command) {
        const notFoundEmbed = UIUtils.createErrorEmbed(
          new Error(`The command "/${commandName}" does not exist.`),
          'Command Not Found',
          [
            'Check the spelling',
            'Use `/help` to see all available commands',
            'Try using the search feature'
          ]
        );
        notFoundEmbed.setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });
        return interaction.reply({ embeds: [notFoundEmbed], ephemeral: isPrivate });
      }
      
      const commandEmbed = UIUtils.createAnimatedEmbed(
        `Command: /${command.data.name}`,
        command.data.description || 'No description available.',
        UIUtils.colors.primary,
        'info',
        [
          {
            name: '🛠️ Usage',
            value: `\`/${command.data.name}\`` + (command.data.options?.length ? ' [options]' : ''),
            inline: true
          },
          {
            name: '📁 Category',
            value: this.getCommandCategory(commandName, categoryMap),
            inline: true
          },
          {
            name: '⏱️ Cooldown',
            value: command.cooldown ? `${command.cooldown}s` : 'None',
            inline: true
          }
        ],
        {
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        }
      );

      // Add options if they exist
      if (command.data.options?.length) {
        const optionsText = command.data.options
          .map(opt => `\`${opt.name}\` - ${opt.description}`)
          .join('\n');
        commandEmbed.addFields({
          name: '⚙️ Options',
          value: optionsText,
          inline: false
        });
      }

      return interaction.reply({ embeds: [commandEmbed], ephemeral: isPrivate });
    }

    // Main help menu
    const mainEmbed = UIUtils.createAnimatedEmbed(
      'Lanya Bot Help Center',
      `Welcome to the **Lanya Bot** help system! 🎉\n\nChoose a category below to explore commands, or use the search feature to find specific commands quickly.`,
      UIUtils.colors.primary,
      'info',
      [
        {
          name: '📊 Bot Statistics',
          value: `**Servers:** ${liveStats.servers}\n**Users:** ${liveStats.users}\n**Commands:** ${liveStats.commands}\n**Uptime:** ${liveStats.uptime}`,
          inline: true
        },
        {
          name: '🔧 Quick Actions',
          value: '• Use `/help search:keyword` to search\n• Use `/help command:name` for details\n• Browse categories below',
          inline: true
        }
      ],
      {
        text: `Requested by ${interaction.user.tag} • ${client.user.username} v${require('../../package.json').version}`,
        iconURL: client.user.displayAvatarURL(),
      },
      client.user.displayAvatarURL()
    );

    // Create category select menu
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('help-menu')
      .setPlaceholder('Select a category to explore commands')
      .addOptions(
        Object.entries(categoryMap).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key,
          emoji: category.emoji,
        }))
      );

    // Create action buttons
    const actionButtons = UIUtils.createActionButtons([
      {
        id: 'help_stats',
        label: 'Statistics',
        emoji: '📊',
        style: 'secondary'
      },
      {
        id: 'help_support',
        label: 'Support',
        emoji: '🆘',
        style: 'secondary'
      },
      {
        id: 'help_invite',
        label: 'Invite',
        emoji: '🔗',
        style: 'success'
      }
    ]);

    const row1 = new ActionRowBuilder().addComponents(categorySelect);
    const row2 = actionButtons;

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [row1, row2],
      ephemeral: isPrivate,
    });

    // Create collector for interactions
    const filter = (i) =>
      (i.customId === 'help-menu' ||
        i.customId === 'help_stats' ||
        i.customId === 'help_support' ||
        i.customId === 'help_invite' ||
        i.customId.startsWith('help_page_')) &&
      i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });

    let currentCategory = null;
    let currentPage = 1;

    collector.on('collect', async (i) => {
      if (i.customId === 'help-menu') {
        currentCategory = i.values[0];
        currentPage = 1;
        await this.updateCategoryEmbed(i, currentCategory, currentPage, categoryMap, liveStats, interaction.user);
      } else if (i.customId === 'help_stats') {
        await this.showStatsEmbed(i, liveStats, client);
      } else if (i.customId === 'help_support') {
        await this.showSupportEmbed(i, client);
      } else if (i.customId === 'help_invite') {
        await this.showInviteEmbed(i, client);
      } else if (i.customId.startsWith('help_page_')) {
        const page = parseInt(i.customId.split('_')[2]);
        if (currentCategory) {
          currentPage = page;
          await this.updateCategoryEmbed(i, currentCategory, currentPage, categoryMap, liveStats, interaction.user);
        }
      }
    });

    collector.on('end', () => {
      // Disable all components when collector expires
      const disabledRow1 = new ActionRowBuilder().addComponents(
        categorySelect.setDisabled(true)
      );
      const disabledRow2 = new ActionRowBuilder().addComponents(
        actionButtons.components.map(button => button.setDisabled(true))
      );
      
      interaction.editReply({
        components: [disabledRow1, disabledRow2],
      }).catch(() => {});
    });
  },

  async updateCategoryEmbed(interaction, category, pageNum, categoryMap, liveStats, user) {
    const categoryInfo = categoryMap[category];
    const commands = this.getCommandsInCategory(category);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(commands.length / itemsPerPage);
    const startIndex = (pageNum - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageCommands = commands.slice(startIndex, endIndex);

    const embed = UIUtils.createAnimatedEmbed(
      `${categoryInfo.emoji} ${categoryInfo.name} Commands`,
      categoryInfo.description,
      categoryInfo.color,
      'info',
      [
        {
          name: '📋 Commands',
          value: pageCommands.length > 0 
            ? pageCommands.map((cmd, index) => 
                `**${startIndex + index + 1}.** \`/${cmd.name}\` - ${cmd.description || 'No description'}`
              ).join('\n')
            : 'No commands in this category.',
          inline: false
        },
        {
          name: '📊 Category Stats',
          value: `**Total Commands:** ${commands.length}\n**Page:** ${pageNum}/${totalPages}\n**Commands on this page:** ${pageCommands.length}`,
          inline: true
        }
      ],
      {
        text: `Requested by ${user.tag} • ${commands.length} commands in ${categoryInfo.name}`,
        iconURL: user.displayAvatarURL(),
      }
    );

    const components = [];

    // Category select menu
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('help-menu')
      .setPlaceholder('Select a category to explore commands')
      .addOptions(
        Object.entries(categoryMap).map(([key, cat]) => ({
          label: cat.name,
          description: cat.description,
          value: key,
          emoji: cat.emoji,
        }))
      );

    components.push(new ActionRowBuilder().addComponents(categorySelect));

    // Pagination controls if needed
    if (totalPages > 1) {
      const paginationButtons = UIUtils.createPaginationControls(
        pageNum, 
        totalPages, 
        {
          first: 'help_page_1',
          prev: `help_page_${pageNum - 1}`,
          next: `help_page_${pageNum + 1}`,
          last: `help_page_${totalPages}`
        }
      );
      components.push(paginationButtons);
    }

    // Action buttons
    const actionButtons = UIUtils.createActionButtons([
      {
        id: 'help_back',
        label: 'Back to Main',
        emoji: '🏠',
        style: 'secondary'
      },
      {
        id: 'help_stats',
        label: 'Statistics',
        emoji: '📊',
        style: 'secondary'
      },
      {
        id: 'help_support',
        label: 'Support',
        emoji: '🆘',
        style: 'secondary'
      }
    ]);

    components.push(actionButtons);

    await interaction.update({
      embeds: [embed],
      components: components,
    });
  },

  async showStatsEmbed(interaction, liveStats, client) {
    const statsEmbed = UIUtils.createStatsEmbed(
      'Bot Statistics',
      {
        '🏠 Servers': liveStats.servers,
        '👥 Users': liveStats.users,
        '⚡ Commands': liveStats.commands,
        '⏱️ Uptime': liveStats.uptime,
        '💾 Memory': liveStats.memory,
        '🌐 Ping': liveStats.ping
      },
      UIUtils.colors.primary,
      {
        text: `${client.user.username} Statistics`,
        iconURL: client.user.displayAvatarURL(),
      }
    );

    const backButton = UIUtils.createActionButtons([
      {
        id: 'help_back',
        label: 'Back to Help',
        emoji: '🔙',
        style: 'secondary'
      }
    ]);

    await interaction.update({
      embeds: [statsEmbed],
      components: [backButton],
    });
  },

  async showSupportEmbed(interaction, client) {
    const supportEmbed = UIUtils.createInfoEmbed(
      'Support & Resources',
      'Need help with the bot? Here are some resources to get you started!',
      [
        {
          name: '🔗 Links',
          value: '• [Support Server](https://discord.gg/support)\n• [Documentation](https://docs.lanya.com)\n• [GitHub](https://github.com/lanya)\n• [Website](https://lanya.com)',
          inline: true
        },
        {
          name: '📞 Contact',
          value: '• Discord: `support#0000`\n• Email: `support@lanya.com`\n• Twitter: `@LanyaBot`',
          inline: true
        }
      ],
      {
        text: `${client.user.username} Support`,
        iconURL: client.user.displayAvatarURL(),
      }
    );

    const backButton = UIUtils.createActionButtons([
      {
        id: 'help_back',
        label: 'Back to Help',
        emoji: '🔙',
        style: 'secondary'
      }
    ]);

    await interaction.update({
      embeds: [supportEmbed],
      components: [backButton],
    });
  },

  async showInviteEmbed(interaction, client) {
    const inviteEmbed = UIUtils.createSuccessEmbed(
      'Invite Lanya Bot',
      'Add Lanya Bot to your server and unlock powerful features!',
      [
        {
          name: '🔗 Invite Link',
          value: `[Click here to invite ${client.user.username}](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`,
          inline: false
        },
        {
          name: '✨ Features',
          value: '• Advanced moderation tools\n• Music playback system\n• Leveling system\n• Fun games and utilities\n• Minecraft integration',
          inline: true
        },
        {
          name: '🛡️ Permissions',
          value: '• Manage messages\n• Manage roles\n• Kick/ban members\n• Connect to voice\n• Send messages',
          inline: true
        }
      ],
      {
        text: `Invite ${client.user.username} to your server!`,
        iconURL: client.user.displayAvatarURL(),
      }
    );

    const backButton = UIUtils.createActionButtons([
      {
        id: 'help_back',
        label: 'Back to Help',
        emoji: '🔙',
        style: 'secondary'
      }
    ]);

    await interaction.update({
      embeds: [inviteEmbed],
      components: [backButton],
    });
  },

  getCommandsInCategory(category) {
    const commands = [];
    const categoryCommands = require('fs')
      .readdirSync(`./commands/${category}`)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const command = require(`../${category}/${file}`);
        return {
          name: command.data.name,
          description: command.data.description,
        };
      });
    return categoryCommands;
  },

  getCommandCategory(commandName, categoryMap) {
    for (const [category, info] of Object.entries(categoryMap)) {
      const commands = this.getCommandsInCategory(category);
      if (commands.some(cmd => cmd.name === commandName)) {
        return `${info.emoji} ${info.name}`;
      }
    }
    return '❓ Unknown';
  },

  getLiveStats(client) {
    const uptime = this.formatUptime(client.uptime);
    const memory = this.formatMemory(process.memoryUsage().heapUsed);
    const ping = client.ws.ping;

    return {
      servers: client.guilds.cache.size.toLocaleString(),
      users: client.users.cache.size.toLocaleString(),
      commands: client.commands.size,
      uptime: uptime,
      memory: memory,
      ping: `${ping}ms`
    };
  },

  formatUptime(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  },

  formatMemory(bytes) {
    return UIUtils.formatBytes(bytes);
  },
};
