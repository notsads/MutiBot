const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { logSuccess, logWarning, logError } = require('../../utils/utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Advanced automod system with customizable rules')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Setup automod rules for the server')
        .addStringOption(option =>
          option
            .setName('rule')
            .setDescription('Type of rule to setup')
            .setRequired(true)
            .addChoices(
              { name: 'Spam Protection', value: 'spam' },
              { name: 'Link Filter', value: 'links' },
              { name: 'Word Filter', value: 'words' },
              { name: 'Caps Filter', value: 'caps' },
              { name: 'Mention Spam', value: 'mentions' },
              { name: 'Invite Filter', value: 'invites' }
            )
        )
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to take when rule is violated')
            .setRequired(true)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warn User', value: 'warn' },
              { name: 'Timeout User', value: 'timeout' },
              { name: 'Kick User', value: 'kick' },
              { name: 'Ban User', value: 'ban' }
            )
        )
        .addIntegerOption(option =>
          option
            .setName('threshold')
            .setDescription('Number of violations before action (1-10)')
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addStringOption(option =>
          option
            .setName('words')
            .setDescription('Comma-separated words to filter (for word filter)')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all active automod rules')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an automod rule')
        .addStringOption(option =>
          option
            .setName('rule')
            .setDescription('Rule to remove')
            .setRequired(true)
            .addChoices(
              { name: 'Spam Protection', value: 'spam' },
              { name: 'Link Filter', value: 'links' },
              { name: 'Word Filter', value: 'words' },
              { name: 'Caps Filter', value: 'caps' },
              { name: 'Mention Spam', value: 'mentions' },
              { name: 'Invite Filter', value: 'invites' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View automod statistics')
    ),

  category: 'utility',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'setup':
        await this.setupRule(interaction);
        break;
      case 'list':
        await this.listRules(interaction);
        break;
      case 'remove':
        await this.removeRule(interaction);
        break;
      case 'stats':
        await this.showStats(interaction);
        break;
    }
  },

  async setupRule(interaction) {
    const rule = interaction.options.getString('rule');
    const action = interaction.options.getString('action');
    const threshold = interaction.options.getInteger('threshold') || 3;
    const words = interaction.options.getString('words');

    const guildId = interaction.guild.id;
    
    // Initialize automod data for guild if it doesn't exist
    if (!global.automodData) global.automodData = new Map();
    if (!global.automodData.has(guildId)) {
      global.automodData.set(guildId, {
        rules: new Map(),
        violations: new Map(),
        stats: {
          totalViolations: 0,
          actionsTaken: 0,
          lastReset: Date.now()
        }
      });
    }

    const guildData = global.automodData.get(guildId);
    
    // Create rule configuration
    const ruleConfig = {
      type: rule,
      action: action,
      threshold: threshold,
      enabled: true,
      createdAt: Date.now(),
      words: words ? words.split(',').map(w => w.trim()) : []
    };

    guildData.rules.set(rule, ruleConfig);

    const setupEmbed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('🛡️ Automod Rule Setup')
      .setDescription(`Successfully configured **${this.getRuleName(rule)}** rule.`)
      .addFields(
        {
          name: '📋 Rule Details',
          value: `**Type:** ${this.getRuleName(rule)}\n**Action:** ${this.getActionName(action)}\n**Threshold:** ${threshold} violations\n**Status:** ✅ Enabled`,
          inline: true
        },
        {
          name: '⚙️ Configuration',
          value: words ? `**Filtered Words:** ${words}` : '**No specific words configured**',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Setup by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      });

    logSuccess(`Automod rule "${rule}" setup in guild ${interaction.guild.name}`);
    await interaction.reply({ embeds: [setupEmbed] });
  },

  async listRules(interaction) {
    const guildId = interaction.guild.id;
    const guildData = global.automodData?.get(guildId);

    if (!guildData || guildData.rules.size === 0) {
      const noRulesEmbed = new EmbedBuilder()
        .setColor(0xFF9800)
        .setTitle('🛡️ Automod Rules')
        .setDescription('No automod rules are currently configured for this server.')
        .addFields({
          name: '💡 Getting Started',
          value: 'Use `/automod setup` to configure your first rule.',
          inline: false
        });

      return await interaction.reply({ embeds: [noRulesEmbed] });
    }

    const rulesEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🛡️ Active Automod Rules')
      .setDescription(`Found **${guildData.rules.size}** active rule(s) for this server.`);

    for (const [ruleType, config] of guildData.rules) {
      const status = config.enabled ? '✅' : '❌';
      const ruleField = {
        name: `${status} ${this.getRuleName(ruleType)}`,
        value: `**Action:** ${this.getActionName(config.action)}\n**Threshold:** ${config.threshold} violations\n**Created:** <t:${Math.floor(config.createdAt / 1000)}:R>`,
        inline: true
      };
      rulesEmbed.addFields(ruleField);
    }

    rulesEmbed.addFields({
      name: '📊 Statistics',
      value: `**Total Violations:** ${guildData.stats.totalViolations}\n**Actions Taken:** ${guildData.stats.actionsTaken}\n**Last Reset:** <t:${Math.floor(guildData.stats.lastReset / 1000)}:R>`,
      inline: false
    });

    const ruleButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('disable_all_rules')
          .setLabel('🔴 Disable All')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('enable_all_rules')
          .setLabel('🟢 Enable All')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('reset_stats')
          .setLabel('📊 Reset Stats')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [rulesEmbed], components: [ruleButtons] });
  },

  async removeRule(interaction) {
    const rule = interaction.options.getString('rule');
    const guildId = interaction.guild.id;
    const guildData = global.automodData?.get(guildId);

    if (!guildData || !guildData.rules.has(rule)) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Rule Not Found')
        .setDescription(`No **${this.getRuleName(rule)}** rule is currently configured.`);

      return await interaction.reply({ embeds: [notFoundEmbed] });
    }

    const removedRule = guildData.rules.get(rule);
    guildData.rules.delete(rule);

    const removeEmbed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('🗑️ Rule Removed')
      .setDescription(`Successfully removed **${this.getRuleName(rule)}** rule.`)
      .addFields({
        name: '📋 Removed Rule',
        value: `**Type:** ${this.getRuleName(rule)}\n**Action:** ${this.getActionName(removedRule.action)}\n**Threshold:** ${removedRule.threshold} violations`,
        inline: false
      })
      .setTimestamp();

    logWarning(`Automod rule "${rule}" removed from guild ${interaction.guild.name}`);
    await interaction.reply({ embeds: [removeEmbed] });
  },

  async showStats(interaction) {
    const guildId = interaction.guild.id;
    const guildData = global.automodData?.get(guildId);

    if (!guildData) {
      const noStatsEmbed = new EmbedBuilder()
        .setColor(0xFF9800)
        .setTitle('📊 Automod Statistics')
        .setDescription('No automod data available for this server.');

      return await interaction.reply({ embeds: [noStatsEmbed] });
    }

    const stats = guildData.stats;
    const activeRules = guildData.rules.size;
    const totalViolations = stats.totalViolations;
    const actionsTaken = stats.actionsTaken;
    const successRate = totalViolations > 0 ? ((actionsTaken / totalViolations) * 100).toFixed(1) : '0.0';

    const statsEmbed = new EmbedBuilder()
      .setColor(0x9C27B0)
      .setTitle('📊 Automod Statistics')
      .setDescription(`Comprehensive statistics for **${interaction.guild.name}**`)
      .addFields(
        {
          name: '🛡️ Active Protection',
          value: `**Active Rules:** ${activeRules}\n**Total Violations:** ${totalViolations}\n**Actions Taken:** ${actionsTaken}`,
          inline: true
        },
        {
          name: '📈 Performance',
          value: `**Success Rate:** ${successRate}%\n**Average per Day:** ${this.calculateDailyAverage(stats.lastReset, totalViolations)}\n**Last Activity:** <t:${Math.floor(stats.lastReset / 1000)}:R>`,
          inline: true
        },
        {
          name: '🎯 Rule Breakdown',
          value: this.getRuleBreakdown(guildData.rules),
          inline: false
        }
      )
      .setTimestamp();

    const statsButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('export_stats')
          .setLabel('📊 Export Data')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('reset_stats')
          .setLabel('🔄 Reset Stats')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [statsEmbed], components: [statsButtons] });
  },

  // Utility methods
  getRuleName(rule) {
    const ruleNames = {
      spam: 'Spam Protection',
      links: 'Link Filter',
      words: 'Word Filter',
      caps: 'Caps Filter',
      mentions: 'Mention Spam',
      invites: 'Invite Filter'
    };
    return ruleNames[rule] || rule;
  },

  getActionName(action) {
    const actionNames = {
      delete: 'Delete Message',
      warn: 'Warn User',
      timeout: 'Timeout User',
      kick: 'Kick User',
      ban: 'Ban User'
    };
    return actionNames[action] || action;
  },

  calculateDailyAverage(lastReset, totalViolations) {
    const daysSinceReset = (Date.now() - lastReset) / (1000 * 60 * 60 * 24);
    return daysSinceReset > 0 ? (totalViolations / daysSinceReset).toFixed(1) : '0.0';
  },

  getRuleBreakdown(rules) {
    if (rules.size === 0) return 'No active rules';
    
    const breakdown = [];
    for (const [ruleType, config] of rules) {
      const status = config.enabled ? '✅' : '❌';
      breakdown.push(`${status} **${this.getRuleName(ruleType)}** - ${this.getActionName(config.action)}`);
    }
    return breakdown.join('\n');
  }
}; 