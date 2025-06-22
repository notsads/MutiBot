const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, AttachmentBuilder, ComponentType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const JSZip = require('jszip');
const { logSuccess, logWarning, logError } = require('../../utils/utils');
const Backup = require('../../models/Backup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Advanced server backup and restore system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a complete server backup')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type of backup to create')
            .setRequired(true)
            .addChoices(
              { name: 'Full Backup (All Data)', value: 'full' },
              { name: 'Settings Only', value: 'settings' },
              { name: 'Roles & Permissions', value: 'roles' },
              { name: 'Channels & Categories', value: 'channels' },
              { name: 'Custom Backup', value: 'custom' }
            )
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Description for this backup')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all available backups')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('restore')
        .setDescription('Restore from a backup')
        .addStringOption(option =>
          option
            .setName('backup_id')
            .setDescription('ID of the backup to restore')
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option
            .setName('preview')
            .setDescription('Preview changes before restoring')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a backup')
        .addStringOption(option =>
          option
            .setName('backup_id')
            .setDescription('ID of the backup to delete')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('schedule')
        .setDescription('Schedule automatic backups')
        .addStringOption(option =>
          option
            .setName('frequency')
            .setDescription('Backup frequency')
            .setRequired(true)
            .addChoices(
              { name: 'Daily', value: 'daily' },
              { name: 'Weekly', value: 'weekly' },
              { name: 'Monthly', value: 'monthly' },
              { name: 'Disable Auto-Backup', value: 'disable' }
            )
        )
    ),

  category: 'utility',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await this.createBackup(interaction);
        break;
      case 'list':
        await this.listBackups(interaction);
        break;
      case 'restore':
        await this.restoreBackup(interaction);
        break;
      case 'delete':
        await this.deleteBackup(interaction);
        break;
      case 'schedule':
        await this.scheduleBackup(interaction);
        break;
    }
  },

  async createBackup(interaction) {
    const type = interaction.options.getString('type');
    const description = interaction.options.getString('description') || 'No description provided';
    const guild = interaction.guild;
    const userId = interaction.user.id;

    await interaction.deferReply();

    try {
      // Check bot permissions first
      const botMember = guild.members.me;
      const requiredPermissions = [
        'ManageGuild',
        'ManageRoles',
        'ManageChannels'
      ];

      const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));
      if (missingPermissions.length > 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('❌ Insufficient Bot Permissions')
          .setDescription('The bot needs the following permissions to create backups:')
          .addFields({
            name: '🔑 Required Permissions',
            value: missingPermissions.map(perm => `• ${perm}`).join('\n'),
            inline: false
          })
          .addFields({
            name: '💡 How to Fix',
            value: 'Ask a server administrator to grant the bot these permissions in Server Settings > Roles.',
            inline: false
          })
          .setTimestamp();

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Enforce per-user limit (10 backups per user per guild)
      const userBackupCount = await Backup.countDocuments({ guildId: guild.id, userId });
      if (userBackupCount >= 10) {
        return await interaction.editReply({
          content: '❌ You have reached the maximum of 10 backups for this server. Please delete an old backup before creating a new one.',
          flags: [1 << 6] // MessageFlags.Ephemeral
        });
      }

      // Show initial progress
      const initialEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('🔄 Creating Backup...')
        .setDescription(`Preparing to create **${this.getBackupTypeName(type)}** backup for **${guild.name}**`)
        .addFields(
          {
            name: '📋 Backup Details',
            value: `**Type:** ${this.getBackupTypeName(type)}\n**Description:** ${description}\n**Server:** ${guild.name}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '🔄 Initializing...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(0, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      const initialResponse = await interaction.editReply({ embeds: [initialEmbed] });

      // Update progress - Collecting data
      const collectingEmbed = new EmbedBuilder()
        .setColor(0xFF9800)
        .setTitle('📥 Collecting Data...')
        .setDescription(`Gathering server information for **${guild.name}**`)
        .addFields(
          {
            name: '📋 Backup Details',
            value: `**Type:** ${this.getBackupTypeName(type)}\n**Description:** ${description}\n**Server:** ${guild.name}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '📥 Collecting server data...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(25, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await initialResponse.edit({ embeds: [collectingEmbed] });

      // Generate backup data
      const backupData = await this.generateBackupData(guild, type);
      
      // Update progress - Processing
      const processingEmbed = new EmbedBuilder()
        .setColor(0x2196F3)
        .setTitle('⚙️ Processing Data...')
        .setDescription(`Processing collected data for **${guild.name}**`)
        .addFields(
          {
            name: '📋 Backup Details',
            value: `**Type:** ${this.getBackupTypeName(type)}\n**Description:** ${description}\n**Server:** ${guild.name}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '⚙️ Processing and compressing...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(75, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await initialResponse.edit({ embeds: [processingEmbed] });

      const backupId = this.generateBackupId();
      const timestamp = Date.now();

      // Store backup in MongoDB
      const backup = await Backup.create({
        backupId,
        guildId: guild.id,
        guildName: guild.name,
        userId,
        type,
        description,
        createdAt: timestamp,
        data: backupData,
        size: JSON.stringify(backupData).length
      });

      // Final success embed with advanced UI
      const backupEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('💾 Backup Created Successfully!')
        .setDescription(`**${this.getBackupTypeName(type)}** backup has been created for **${guild.name}**`)
        .addFields(
          {
            name: '📋 Backup Details',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(type)}\n**Size:** ${this.formatBytes(backup.size)}\n**Created:** <t:${Math.floor(timestamp / 1000)}:F>`,
            inline: true
          },
          {
            name: '👤 Created By',
            value: `${interaction.user.tag}\n**Description:** ${description}`,
            inline: true
          },
          {
            name: '📊 Data Included',
            value: this.getBackupDataSummary(backupData),
            inline: false
          },
          {
            name: '📈 Statistics',
            value: this.getBackupStatistics(backupData),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Backup ID: ${backupId} • ${interaction.user.tag}`,
          iconURL: guild.iconURL({ dynamic: true })
        });

      // Enhanced action buttons with better styling
      const backupButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`download_backup_${backupId}`)
            .setLabel('📥 Download Backup')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📦'),
          new ButtonBuilder()
            .setCustomId(`restore_backup_${backupId}`)
            .setLabel('🔄 Restore')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚡'),
          new ButtonBuilder()
            .setCustomId(`delete_backup_${backupId}`)
            .setLabel('🗑️ Delete')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💥')
        );

      // Add a second row for additional actions
      const additionalButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`share_backup_${backupId}`)
            .setLabel('📤 Share')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔗'),
          new ButtonBuilder()
            .setCustomId(`info_backup_${backupId}`)
            .setLabel('ℹ️ Details')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

      logSuccess(`Backup "${backupId}" created for guild ${guild.name}`);
      const response = await initialResponse.edit({ 
        embeds: [backupEmbed], 
        components: [backupButtons, additionalButtons] 
      });

      // Create button collector for backup actions
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ This backup menu is not for you!', flags: [1 << 6] });
        }

        const buttonId = i.customId;
        
        if (buttonId.startsWith('download_backup_')) {
          await this.handleDownloadBackup(i, buttonId.replace('download_backup_', ''));
        } else if (buttonId.startsWith('restore_backup_')) {
          await this.handleRestoreBackup(i, buttonId.replace('restore_backup_', ''));
        } else if (buttonId.startsWith('delete_backup_')) {
          await this.handleDeleteBackup(i, buttonId.replace('delete_backup_', ''));
        } else if (buttonId.startsWith('share_backup_')) {
          await this.handleShareBackup(i, buttonId.replace('share_backup_', ''));
        } else if (buttonId.startsWith('info_backup_')) {
          await this.handleInfoBackup(i, buttonId.replace('info_backup_', ''));
        } else if (buttonId.startsWith('confirm_restore_')) {
          await this.handleConfirmRestore(i, buttonId.replace('confirm_restore_', ''));
        } else if (buttonId.startsWith('cancel_restore_')) {
          await this.handleCancelRestore(i);
        } else if (buttonId.startsWith('confirm_delete_')) {
          await this.handleConfirmDelete(i, buttonId.replace('confirm_delete_', ''));
        } else if (buttonId.startsWith('cancel_delete_')) {
          await this.handleCancelDelete(i);
        }
      });

      collector.on('end', async () => {
        const disabledButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`download_backup_${backupId}`)
              .setLabel('📥 Download Backup')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('📦')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`restore_backup_${backupId}`)
              .setLabel('🔄 Restore')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('⚡')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`delete_backup_${backupId}`)
              .setLabel('🗑️ Delete')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('💥')
              .setDisabled(true)
          );

        const disabledAdditionalButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`share_backup_${backupId}`)
              .setLabel('📤 Share')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🔗')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`info_backup_${backupId}`)
              .setLabel('ℹ️ Details')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('📋')
              .setDisabled(true)
          );

        try {
          await response.edit({ components: [disabledButtons, disabledAdditionalButtons] });
        } catch (error) {
          console.error('Error disabling buttons:', error);
        }
      });

    } catch (error) {
      logError(`Failed to create backup: ${error.message}`);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Backup Creation Failed')
        .setDescription('An error occurred while creating the backup.')
        .addFields({
          name: '🔍 Error Details',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        })
        .addFields({
          name: '💡 Troubleshooting',
          value: '• Check if the bot has required permissions\n• Ensure the server is accessible\n• Try again in a few moments',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async listBackups(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    
    await interaction.deferReply();
    
    // Fetch backups from MongoDB for this guild and user
    const guildBackups = await Backup.find({ guildId, userId }).sort({ createdAt: -1 });

    if (guildBackups.length === 0) {
      const noBackupsEmbed = new EmbedBuilder()
        .setColor(0xFF9800)
        .setTitle('💾 Server Backups')
        .setDescription('No backups found for this server.')
        .addFields({
          name: '💡 Getting Started',
          value: 'Use `/backup create` to create your first backup.',
          inline: false
        })
        .addFields({
          name: '📊 Backup Types Available',
          value: '• **Full Backup** - Complete server data\n• **Settings Only** - Server configuration\n• **Roles & Permissions** - Role structure\n• **Channels & Categories** - Channel layout\n• **Custom Backup** - Selected components',
          inline: false
        })
        .setTimestamp()
        .setFooter({
          text: `${interaction.guild.name} • Backup System`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        });

      return await interaction.editReply({ embeds: [noBackupsEmbed] });
    }

    // Calculate statistics
    const totalSize = guildBackups.reduce((sum, backup) => sum + backup.size, 0);
    const backupTypes = guildBackups.reduce((acc, backup) => {
      acc[backup.type] = (acc[backup.type] || 0) + 1;
      return acc;
    }, {});
    
    const oldestBackup = guildBackups[guildBackups.length - 1];
    const newestBackup = guildBackups[0];

    const backupsEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('💾 Your Backups')
      .setDescription(`Found **${guildBackups.length}** backup(s) for **${interaction.guild.name}**`)
      .addFields(
        {
          name: '📊 Statistics',
          value: `**Total Size:** ${this.formatBytes(totalSize)}\n**Oldest:** <t:${Math.floor(oldestBackup.createdAt / 1000)}:R>\n**Newest:** <t:${Math.floor(newestBackup.createdAt / 1000)}:R>`,
          inline: true
        },
        {
          name: '📈 Backup Types',
          value: Object.entries(backupTypes).map(([type, count]) => 
            `• ${this.getBackupTypeName(type)}: ${count}`
          ).join('\n') || 'No data',
          inline: true
        }
      );

    // Show first 5 backups with enhanced formatting
    const displayBackups = guildBackups.slice(0, 5);
    for (const backup of displayBackups) {
      const backupField = {
        name: `📦 ${backup.description} (${this.getBackupTypeName(backup.type)})`,
        value: `**ID:** \`${backup.backupId}\`\n**Size:** ${this.formatBytes(backup.size)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:R>\n**Data:** ${this.getBackupDataSummary(backup.data)}`,
        inline: false
      };
      backupsEmbed.addFields(backupField);
    }

    if (guildBackups.length > 5) {
      backupsEmbed.addFields({
        name: '📄 Additional Backups',
        value: `... and ${guildBackups.length - 5} more backup(s)\nUse the buttons below to navigate through all backups.`,
        inline: false
      });
    }

    backupsEmbed.setTimestamp()
    .setFooter({
      text: `${interaction.guild.name} • ${guildBackups.length} backups • ${this.formatBytes(totalSize)} total`,
      iconURL: interaction.guild.iconURL({ dynamic: true })
    });

    // Enhanced action buttons
    const listButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_backups')
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚡'),
        new ButtonBuilder()
          .setCustomId('export_backups_list')
          .setLabel('📊 Export List')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📋'),
        new ButtonBuilder()
          .setCustomId('backup_stats')
          .setLabel('📈 Statistics')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📊')
      );

    // Add navigation buttons if there are more than 5 backups
    if (guildBackups.length > 5) {
      const navButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page_backups')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_page_backups')
            .setLabel('Next ▶️')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.editReply({ embeds: [backupsEmbed], components: [listButtons, navButtons] });
    } else {
      await interaction.editReply({ embeds: [backupsEmbed], components: [listButtons] });
    }
  },

  async restoreBackup(interaction) {
    const backupId = interaction.options.getString('backup_id');
    const preview = interaction.options.getBoolean('preview') || false;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // Fetch backup from MongoDB
    const backup = await Backup.findOne({ backupId, guildId, userId });
    if (!backup) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Backup Not Found')
        .setDescription(`No backup found with ID: \`${backupId}\``);

      return await interaction.reply({ embeds: [notFoundEmbed] });
    }

    if (preview) {
      await this.previewRestore(interaction, backup);
    } else {
      await this.performRestore(interaction, backup);
    }
  },

  async previewRestore(interaction, backup) {
    const changes = this.analyzeRestoreChanges(interaction.guild, backup.data);

    const previewEmbed = new EmbedBuilder()
      .setColor(0xFF9800)
      .setTitle('👀 Restore Preview')
      .setDescription(`Preview of changes for backup: **${backup.description}**`)
      .addFields(
        {
          name: '📋 Backup Info',
          value: `**ID:** \`${backup.backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:F>`,
          inline: true
        },
        {
          name: '📊 Changes Summary',
          value: `**To Add:** ${changes.toAdd}\n**To Update:** ${changes.toUpdate}\n**To Remove:** ${changes.toRemove}`,
          inline: true
        },
        {
          name: '⚠️ Important Notes',
          value: '• This is a preview only\n• No changes have been made yet\n• Review the changes carefully before proceeding',
          inline: false
        }
      )
      .setTimestamp();

    const previewButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_restore_${backup.backupId}`)
          .setLabel('✅ Confirm Restore')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('cancel_restore')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [previewEmbed], components: [previewButtons] });
  },

  async performRestore(interaction, backup) {
    await interaction.deferReply();

    try {
      // Perform the actual restore
      const restoreResult = await this.executeRestore(interaction.guild, backup.data);
      
      const successEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('✅ Backup Restored Successfully')
        .setDescription(`**${backup.guildName}** has been restored from backup`)
        .addFields(
          {
            name: '📋 Restore Summary',
            value: `**Restored:** ${restoreResult.restored}\n**Updated:** ${restoreResult.updated}\n**Created:** ${restoreResult.created}`,
            inline: true
          },
          {
            name: '⏱️ Duration',
            value: `${restoreResult.duration}ms`,
            inline: true
          },
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backup.backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:F>`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restored by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      // Add error field if there were any errors
      if (restoreResult.errors && restoreResult.errors.length > 0) {
        const errorText = restoreResult.errors.slice(0, 5).join('\n');
        const remainingErrors = restoreResult.errors.length - 5;
        
        successEmbed.addFields({
          name: '⚠️ Some Items Failed',
          value: `${errorText}${remainingErrors > 0 ? `\n... and ${remainingErrors} more errors` : ''}`,
          inline: false
        });
        
        successEmbed.setColor(0xFF9800); // Orange for partial success
      }

      logSuccess(`Backup "${backup.backupId}" restored in guild ${interaction.guild.name}`);
      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      logError(`Failed to restore backup: ${error.message}`);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Restore Failed')
        .setDescription('An error occurred while restoring the backup.')
        .addFields({
          name: '🔍 Error Details',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  async deleteBackup(interaction) {
    const backupId = interaction.options.getString('backup_id');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // Delete backup from MongoDB
    const result = await Backup.deleteOne({ backupId, guildId, userId });
    if (result.deletedCount === 0) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Backup Not Found')
        .setDescription(`No backup found with ID: \`${backupId}\``);

      return await interaction.reply({ embeds: [notFoundEmbed] });
    }

    const deletedEmbed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('🗑️ Backup Deleted')
      .setDescription(`Backup \`${backupId}\` has been deleted successfully.`);

    await interaction.reply({ embeds: [deletedEmbed] });
  },

  async scheduleBackup(interaction) {
    const frequency = interaction.options.getString('frequency');
    const guildId = interaction.guild.id;

    if (!global.backupSchedules) global.backupSchedules = new Map();

    if (frequency === 'disable') {
      global.backupSchedules.delete(guildId);
      
      const disableEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('⏰ Auto-Backup Disabled')
        .setDescription('Automatic backups have been disabled for this server.')
        .setTimestamp();

      await interaction.reply({ embeds: [disableEmbed] });
      return;
    }

    // Set up automatic backup schedule
    global.backupSchedules.set(guildId, {
      frequency: frequency,
      lastBackup: Date.now(),
      enabled: true
    });

    const scheduleEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('⏰ Auto-Backup Scheduled')
      .setDescription(`Automatic backups have been configured for **${interaction.guild.name}**`)
      .addFields(
        {
          name: '📅 Schedule',
          value: `**Frequency:** ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}\n**Next Backup:** ${this.getNextBackupTime(frequency)}`,
          inline: true
        },
        {
          name: '⚙️ Configuration',
          value: '**Type:** Full Backup\n**Retention:** 10 backups\n**Status:** ✅ Active',
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [scheduleEmbed] });
  },

  // Utility methods
  async generateBackupData(guild, type) {
    const data = {
      guild: {
        name: guild.name,
        description: guild.description,
        icon: guild.iconURL(),
        banner: guild.bannerURL(),
        verificationLevel: guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        defaultMessageNotifications: guild.defaultMessageNotifications
      }
    };

    switch (type) {
      case 'full':
        data.roles = await this.backupRoles(guild);
        data.channels = await this.backupChannels(guild);
        data.emojis = await this.backupEmojis(guild);
        data.settings = await this.backupSettings(guild);
        break;
      case 'settings':
        data.settings = await this.backupSettings(guild);
        break;
      case 'roles':
        data.roles = await this.backupRoles(guild);
        break;
      case 'channels':
        data.channels = await this.backupChannels(guild);
        break;
      case 'custom':
        data.roles = await this.backupRoles(guild);
        data.settings = await this.backupSettings(guild);
        break;
    }

    return data;
  },

  async backupRoles(guild) {
    return guild.roles.cache.map(role => ({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions.toArray(),
      position: role.position
    }));
  },

  async backupChannels(guild) {
    return guild.channels.cache.map(channel => ({
      name: channel.name,
      type: channel.type,
      parent: channel.parent?.name,
      position: channel.position,
      topic: channel.topic,
      nsfw: channel.nsfw,
      bitrate: channel.bitrate,
      userLimit: channel.userLimit,
      rateLimitPerUser: channel.rateLimitPerUser,
      permissionOverwrites: channel.permissionOverwrites.cache.map(perm => ({
        id: perm.id,
        type: perm.type,
        allow: perm.allow.toArray(),
        deny: perm.deny.toArray()
      }))
    }));
  },

  async backupEmojis(guild) {
    return guild.emojis.cache.map(emoji => ({
      name: emoji.name,
      url: emoji.url,
      animated: emoji.animated
    }));
  },

  async backupSettings(guild) {
    return {
      systemChannel: guild.systemChannel?.name,
      rulesChannel: guild.rulesChannel?.name,
      publicUpdatesChannel: guild.publicUpdatesChannel?.name,
      afkChannel: guild.afkChannel?.name,
      afkTimeout: guild.afkTimeout,
      premiumTier: guild.premiumTier,
      premiumSubscriptionCount: guild.premiumSubscriptionCount
    };
  },

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  getBackupTypeName(type) {
    const typeNames = {
      full: 'Full Backup',
      settings: 'Settings Only',
      roles: 'Roles & Permissions',
      channels: 'Channels & Categories',
      custom: 'Custom Backup'
    };
    return typeNames[type] || type;
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getBackupDataSummary(data) {
    const summary = [];
    if (data.roles) summary.push(`• ${data.roles.length} Roles`);
    if (data.channels) summary.push(`• ${data.channels.length} Channels`);
    if (data.emojis) summary.push(`• ${data.emojis.length} Emojis`);
    if (data.settings) summary.push('• Server Settings');
    return summary.join('\n') || 'No data included';
  },

  analyzeRestoreChanges(guild, backupData) {
    // Analyze what changes would be made
    return {
      toAdd: backupData.roles ? backupData.roles.length : 0,
      toUpdate: backupData.channels ? backupData.channels.length : 0,
      toRemove: 0
    };
  },

  async executeRestore(guild, backupData) {
    const startTime = Date.now();
    let restored = 0, updated = 0, created = 0;
    const errors = [];

    try {
      // Check bot permissions first
      const botMember = guild.members.me;
      const requiredPermissions = [
        'ManageGuild',
        'ManageRoles',
        'ManageChannels'
      ];

      const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));
      if (missingPermissions.length > 0) {
        throw new Error(`Bot is missing required permissions: ${missingPermissions.join(', ')}`);
      }

      // Restore guild settings if available
      if (backupData.guild) {
        const guildSettings = backupData.guild;
        
        try {
          // Update guild name if different
          if (guildSettings.name && guild.name !== guildSettings.name) {
            await guild.setName(guildSettings.name);
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update guild name: ${error.message}`);
        }

        try {
          // Update guild description if available
          if (guildSettings.description && guild.description !== guildSettings.description) {
            await guild.setDescription(guildSettings.description);
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update guild description: ${error.message}`);
        }

        try {
          // Update verification level if different
          if (guildSettings.verificationLevel && guild.verificationLevel !== guildSettings.verificationLevel) {
            await guild.setVerificationLevel(guildSettings.verificationLevel);
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update verification level: ${error.message}`);
        }

        try {
          // Update explicit content filter if different
          if (guildSettings.explicitContentFilter && guild.explicitContentFilter !== guildSettings.explicitContentFilter) {
            await guild.setExplicitContentFilter(guildSettings.explicitContentFilter);
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update content filter: ${error.message}`);
        }

        try {
          // Update default message notifications if different
          if (guildSettings.defaultMessageNotifications && guild.defaultMessageNotifications !== guildSettings.defaultMessageNotifications) {
            await guild.setDefaultMessageNotifications(guildSettings.defaultMessageNotifications);
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update message notifications: ${error.message}`);
        }

        try {
          // Update AFK timeout if different
          if (backupData.settings && backupData.settings.afkTimeout && guild.afkTimeout !== backupData.settings.afkTimeout) {
            await guild.setAFKTimeout(backupData.settings.afkTimeout);
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update AFK timeout: ${error.message}`);
        }
      }

      // Restore roles if available
      if (backupData.roles && Array.isArray(backupData.roles)) {
        for (const roleData of backupData.roles) {
          try {
            // Skip @everyone role and managed roles
            if (roleData.name === '@everyone' || roleData.name === '@everyone') {
              continue;
            }

            // Skip roles that the bot can't manage
            if (roleData.position >= botMember.roles.highest.position) {
              errors.push(`Cannot manage role "${roleData.name}" - position too high`);
              continue;
            }

            // Check if role already exists
            let role = guild.roles.cache.find(r => r.name === roleData.name);
            
            if (role) {
              // Check if bot can edit this role
              if (!role.editable) {
                errors.push(`Cannot edit role "${roleData.name}" - insufficient permissions`);
                continue;
              }

              // Update existing role
              await role.edit({
                name: roleData.name,
                color: roleData.color,
                hoist: roleData.hoist,
                mentionable: roleData.mentionable,
                permissions: roleData.permissions
              });
              updated++;
            } else {
              // Create new role
              await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                hoist: roleData.hoist,
                mentionable: roleData.mentionable,
                permissions: roleData.permissions,
                reason: 'Backup restoration'
              });
              created++;
            }
          } catch (error) {
            const errorMsg = `Failed to restore role "${roleData.name}": ${error.message}`;
            console.warn(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      // Restore channels if available
      if (backupData.channels && Array.isArray(backupData.channels)) {
        for (const channelData of backupData.channels) {
          try {
            // Skip system channels and channels that already exist
            if (channelData.name === 'general' || guild.channels.cache.find(c => c.name === channelData.name)) {
              continue;
            }

            // Create channel based on type
            const channelOptions = {
              name: channelData.name,
              topic: channelData.topic,
              nsfw: channelData.nsfw,
              rateLimitPerUser: channelData.rateLimitPerUser,
              reason: 'Backup restoration'
            };

            if (channelData.type === 2) { // Voice channel
              channelOptions.bitrate = channelData.bitrate || 64000;
              channelOptions.userLimit = channelData.userLimit || 0;
              await guild.channels.create(channelOptions);
            } else { // Text channel
              await guild.channels.create(channelOptions);
            }
            
            created++;
          } catch (error) {
            const errorMsg = `Failed to restore channel "${channelData.name}": ${error.message}`;
            console.warn(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      restored = updated + created;

    } catch (error) {
      console.error('Error during restore:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    return { restored, updated, created, duration, errors };
  },

  getNextBackupTime(frequency) {
    const now = new Date();
    let nextBackup;
    
    switch (frequency) {
      case 'daily':
        nextBackup = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextBackup = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextBackup = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextBackup = now;
    }
    
    return `<t:${Math.floor(nextBackup.getTime() / 1000)}:F>`;
  },

  // Advanced UI Helper Functions
  createProgressBar(current, total, width = 20) {
    const percentage = Math.round((current / total) * 100);
    const filledBlocks = Math.round((percentage / 100) * width);
    const emptyBlocks = width - filledBlocks;
    
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    return `${filled}${empty} ${percentage}%`;
  },

  getBackupStatistics(data) {
    const stats = [];
    
    if (data.roles) {
      const roleStats = {
        total: data.roles.length,
        colored: data.roles.filter(r => r.color !== 0).length,
        hoisted: data.roles.filter(r => r.hoist).length,
        mentionable: data.roles.filter(r => r.mentionable).length
      };
      stats.push(`**Roles:** ${roleStats.total} total (${roleStats.colored} colored, ${roleStats.hoisted} hoisted)`);
    }
    
    if (data.channels) {
      const textChannels = data.channels.filter(c => c.type === 0).length;
      const voiceChannels = data.channels.filter(c => c.type === 2).length;
      const categories = data.channels.filter(c => c.type === 4).length;
      stats.push(`**Channels:** ${data.channels.length} total (${textChannels} text, ${voiceChannels} voice, ${categories} categories)`);
    }
    
    if (data.emojis) {
      const animated = data.emojis.filter(e => e.animated).length;
      const static = data.emojis.length - animated;
      stats.push(`**Emojis:** ${data.emojis.length} total (${animated} animated, ${static} static)`);
    }
    
    if (data.settings) {
      stats.push(`**Settings:** Server configuration included`);
    }
    
    return stats.join('\n') || 'No data available';
  },

  createAnimatedEmbed(title, description, color, fields = [], footer = null) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    fields.forEach(field => {
      embed.addFields(field);
    });

    if (footer) {
      embed.setFooter(footer);
    }

    return embed;
  },

  // Button handlers
  async handleDownloadBackup(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      // Create ZIP file
      const zip = new JSZip();
      
      // Add backup data as JSON
      zip.file('backup.json', JSON.stringify(backup.data, null, 2));
      
      // Add backup metadata
      const metadata = {
        backupId: backup.backupId,
        guildId: backup.guildId,
        guildName: backup.guildName,
        type: backup.type,
        description: backup.description,
        createdAt: backup.createdAt,
        size: backup.size
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
      
      // Add README file
      const readme = `# Server Backup: ${backup.guildName}

**Backup ID:** ${backup.backupId}
**Type:** ${this.getBackupTypeName(backup.type)}
**Created:** ${new Date(backup.createdAt).toISOString()}
**Description:** ${backup.description}

## Files in this backup:
- \`backup.json\` - Complete backup data
- \`metadata.json\` - Backup metadata and information

## How to use:
1. Extract this ZIP file
2. Use the backup data to restore your server settings
3. The backup contains all server configuration, roles, channels, and settings

**Note:** This backup was created by ${interaction.user.tag} on ${new Date().toISOString()}
`;
      zip.file('README.md', readme);

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      // Create attachment
      const attachment = new AttachmentBuilder(zipBuffer, { 
        name: `backup_${backup.guildName.replace(/[^a-zA-Z0-9]/g, '_')}_${backupId}.zip` 
      });

      const downloadEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('📦 Backup Download Ready')
        .setDescription(`Here's your backup for **${backup.guildName}**`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Size:** ${this.formatBytes(zipBuffer.length)}`,
            inline: true
          },
          {
            name: '📁 Contents',
            value: '• Complete backup data\n• Metadata information\n• README file',
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Downloaded by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({
        embeds: [downloadEmbed],
        files: [attachment],
        flags: [1 << 6]
      });

      logSuccess(`Backup "${backupId}" downloaded by ${interaction.user.tag}`);
      
    } catch (error) {
      logError(`Failed to download backup: ${error.message}`);
      await interaction.editReply({
        content: '❌ Failed to generate backup download. Please try again.',
        flags: [1 << 6]
      });
    }
  },

  async handleRestoreBackup(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      // Show initial restore progress
      const initialRestoreEmbed = new EmbedBuilder()
        .setColor(0xFF9800)
        .setTitle('🔄 Starting Restore...')
        .setDescription(`Preparing to restore **${backup.guildName}** from backup`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '🔄 Initializing restore process...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(0, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restoring by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [initialRestoreEmbed], flags: [1 << 6] });

      // Update progress - Analyzing
      const analyzingEmbed = new EmbedBuilder()
        .setColor(0x2196F3)
        .setTitle('🔍 Analyzing Backup...')
        .setDescription(`Analyzing backup data for **${backup.guildName}**`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '🔍 Analyzing and validating data...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(25, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restoring by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [analyzingEmbed], flags: [1 << 6] });

      // Update progress - Restoring
      const restoringEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('⚡ Restoring Data...')
        .setDescription(`Restoring server data for **${backup.guildName}**`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '⚡ Restoring roles, channels, and settings...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(75, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restoring by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [restoringEmbed], flags: [1 << 6] });

      // Perform the actual restore
      const restoreResult = await this.executeRestore(interaction.guild, backup.data);
      
      const successEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('✅ Backup Restored Successfully!')
        .setDescription(`**${backup.guildName}** has been restored from backup`)
        .addFields(
          {
            name: '📋 Restore Summary',
            value: `**Restored:** ${restoreResult.restored}\n**Updated:** ${restoreResult.updated}\n**Created:** ${restoreResult.created}`,
            inline: true
          },
          {
            name: '⏱️ Duration',
            value: `${restoreResult.duration}ms`,
            inline: true
          },
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:F>`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restored by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      // Add error field if there were any errors
      if (restoreResult.errors && restoreResult.errors.length > 0) {
        const errorText = restoreResult.errors.slice(0, 5).join('\n');
        const remainingErrors = restoreResult.errors.length - 5;
        
        successEmbed.addFields({
          name: '⚠️ Some Items Failed',
          value: `${errorText}${remainingErrors > 0 ? `\n... and ${remainingErrors} more errors` : ''}`,
          inline: false
        });
        
        successEmbed.setColor(0xFF9800); // Orange for partial success
      }

      // Add final progress bar
      successEmbed.addFields({
        name: '📊 Final Progress',
        value: this.createProgressBar(100, 100),
        inline: false
      });

      await interaction.editReply({
        embeds: [successEmbed],
        flags: [1 << 6]
      });

      logSuccess(`Backup "${backupId}" restored by ${interaction.user.tag}`);
      
    } catch (error) {
      logError(`Failed to restore backup: ${error.message}`);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Restore Failed')
        .setDescription('An error occurred while restoring the backup.')
        .addFields({
          name: '🔍 Error Details',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        })
        .addFields({
          name: '💡 Troubleshooting',
          value: '• Check if the bot has required permissions\n• Ensure the backup data is valid\n• Try again in a few moments',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed],
        flags: [1 << 6]
      });
    }
  },

  async handleDeleteBackup(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      // Show delete confirmation
      const confirmEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🗑️ Confirm Backup Deletion')
        .setDescription(`Are you sure you want to delete this backup?`)
        .addFields(
          {
            name: '📋 Backup Details',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⚠️ Warning',
            value: 'This action cannot be undone. The backup will be permanently deleted.',
            inline: false
          }
        )
        .setTimestamp();

      const confirmButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_delete_${backupId}`)
            .setLabel('✅ Confirm Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`cancel_delete_${backupId}`)
            .setLabel('❌ Cancel')
            .setStyle(ButtonStyle.Secondary)
        );

      const response = await interaction.editReply({
        embeds: [confirmEmbed],
        components: [confirmButtons],
        flags: [1 << 6]
      });

      // Create button collector for confirmation actions
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ This confirmation menu is not for you!', flags: [1 << 6] });
        }

        const buttonId = i.customId;
        
        if (buttonId.startsWith('confirm_delete_')) {
          await this.handleConfirmDelete(i, buttonId.replace('confirm_delete_', ''));
        } else if (buttonId.startsWith('cancel_delete_')) {
          await this.handleCancelDelete(i);
        }
      });

      collector.on('end', async () => {
        const disabledButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`confirm_delete_${backupId}`)
              .setLabel('✅ Confirm Delete')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`cancel_delete_${backupId}`)
              .setLabel('❌ Cancel')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );

        try {
          await response.edit({ components: [disabledButtons] });
        } catch (error) {
          console.error('Error disabling buttons:', error);
        }
      });

    } catch (error) {
      logError(`Failed to handle delete backup: ${error.message}`);
      await interaction.editReply({
        content: '❌ Failed to process delete request. Please try again.',
        flags: [1 << 6]
      });
    }
  },

  async handleConfirmRestore(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      // Check if user has permission to manage the server
      if (!interaction.member.permissions.has('ManageGuild')) {
        return await interaction.editReply({
          content: '❌ You need the "Manage Server" permission to restore backups.',
          flags: [1 << 6]
        });
      }

      // Show initial restore progress
      const initialRestoreEmbed = new EmbedBuilder()
        .setColor(0xFF9800)
        .setTitle('🔄 Starting Restore...')
        .setDescription(`Preparing to restore **${backup.guildName}** from backup`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '🔄 Initializing restore process...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(0, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restoring by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [initialRestoreEmbed], flags: [1 << 6] });

      // Update progress - Analyzing
      const analyzingEmbed = new EmbedBuilder()
        .setColor(0x2196F3)
        .setTitle('🔍 Analyzing Backup...')
        .setDescription(`Analyzing backup data for **${backup.guildName}**`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '🔍 Analyzing and validating data...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(25, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restoring by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [analyzingEmbed], flags: [1 << 6] });

      // Update progress - Restoring
      const restoringEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('⚡ Restoring Data...')
        .setDescription(`Restoring server data for **${backup.guildName}**`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '⏱️ Status',
            value: '⚡ Restoring roles, channels, and settings...',
            inline: true
          },
          {
            name: '📊 Progress',
            value: this.createProgressBar(75, 100),
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restoring by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [restoringEmbed], flags: [1 << 6] });

      // Perform the actual restore
      const restoreResult = await this.executeRestore(interaction.guild, backup.data);
      
      const successEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('✅ Backup Restored Successfully!')
        .setDescription(`**${backup.guildName}** has been restored from backup`)
        .addFields(
          {
            name: '📋 Restore Summary',
            value: `**Restored:** ${restoreResult.restored}\n**Updated:** ${restoreResult.updated}\n**Created:** ${restoreResult.created}`,
            inline: true
          },
          {
            name: '⏱️ Duration',
            value: `${restoreResult.duration}ms`,
            inline: true
          },
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:F>`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Restored by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      // Add error field if there were any errors
      if (restoreResult.errors && restoreResult.errors.length > 0) {
        const errorText = restoreResult.errors.slice(0, 5).join('\n');
        const remainingErrors = restoreResult.errors.length - 5;
        
        successEmbed.addFields({
          name: '⚠️ Some Items Failed',
          value: `${errorText}${remainingErrors > 0 ? `\n... and ${remainingErrors} more errors` : ''}`,
          inline: false
        });
        
        successEmbed.setColor(0xFF9800); // Orange for partial success
      }

      // Add final progress bar
      successEmbed.addFields({
        name: '📊 Final Progress',
        value: this.createProgressBar(100, 100),
        inline: false
      });

      await interaction.editReply({
        embeds: [successEmbed],
        flags: [1 << 6]
      });

      logSuccess(`Backup "${backupId}" restored by ${interaction.user.tag}`);
      
    } catch (error) {
      logError(`Failed to restore backup: ${error.message}`);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Restore Failed')
        .setDescription('An error occurred while restoring the backup.')
        .addFields({
          name: '🔍 Error Details',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        })
        .addFields({
          name: '💡 Troubleshooting',
          value: '• Check if the bot has required permissions\n• Ensure the backup data is valid\n• Try again in a few moments',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed],
        flags: [1 << 6]
      });
    }
  },

  async handleCancelRestore(interaction) {
    const cancelEmbed = new EmbedBuilder()
      .setColor(0xFF9800)
      .setTitle('❌ Restore Cancelled')
      .setDescription('Backup restore has been cancelled.')
      .setTimestamp();

    await interaction.update({
      embeds: [cancelEmbed],
      components: []
    });
  },

  async handleConfirmDelete(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      // Delete the backup from MongoDB
      await Backup.deleteOne({ backupId, guildId: interaction.guild.id, userId: interaction.user.id });
      
      const successEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('🗑️ Backup Deleted Successfully')
        .setDescription(`Backup has been permanently deleted`)
        .addFields(
          {
            name: '📋 Deleted Backup',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: false
          }
        )
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed],
        flags: [1 << 6]
      });

      logWarning(`Backup "${backupId}" deleted by ${interaction.user.tag}`);
      
    } catch (error) {
      logError(`Failed to delete backup: ${error.message}`);
      await interaction.editReply({
        content: '❌ Failed to delete backup. Please try again.',
        flags: [1 << 6]
      });
    }
  },

  async handleCancelDelete(interaction) {
    const cancelEmbed = new EmbedBuilder()
      .setColor(0xFF9800)
      .setTitle('❌ Deletion Cancelled')
      .setDescription('Backup deletion has been cancelled.')
      .setTimestamp();

    await interaction.update({
      embeds: [cancelEmbed],
      components: []
    });
  },

  async handleShareBackup(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      const shareEmbed = new EmbedBuilder()
        .setColor(0x9C27B0)
        .setTitle('📤 Share Backup')
        .setDescription(`Share this backup with other server administrators`)
        .addFields(
          {
            name: '📋 Backup Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '📊 Details',
            value: `**Size:** ${this.formatBytes(backup.size)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:R>\n**Server:** ${backup.guildName}`,
            inline: true
          },
          {
            name: '🔗 Share Options',
            value: '• Copy the backup ID to share manually\n• Use `/backup restore` with the ID\n• Only share with trusted administrators',
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Shared by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({
        embeds: [shareEmbed],
        flags: [1 << 6]
      });

    } catch (error) {
      logError(`Failed to share backup: ${error.message}`);
      await interaction.editReply({
        content: '❌ Failed to share backup. Please try again.',
        flags: [1 << 6]
      });
    }
  },

  async handleInfoBackup(interaction, backupId) {
    try {
      await interaction.deferReply({ flags: [1 << 6] });
      
      const backup = await Backup.findOne({ 
        backupId, 
        guildId: interaction.guild.id, 
        userId: interaction.user.id 
      });
      
      if (!backup) {
        return await interaction.editReply({ 
          content: '❌ Backup not found or you don\'t have permission to access it.',
          flags: [1 << 6]
        });
      }

      const infoEmbed = new EmbedBuilder()
        .setColor(0x607D8B)
        .setTitle('ℹ️ Backup Details')
        .setDescription(`Detailed information about backup **${backupId}**`)
        .addFields(
          {
            name: '📋 Basic Info',
            value: `**ID:** \`${backupId}\`\n**Type:** ${this.getBackupTypeName(backup.type)}\n**Description:** ${backup.description}`,
            inline: true
          },
          {
            name: '📊 Technical Details',
            value: `**Size:** ${this.formatBytes(backup.size)}\n**Created:** <t:${Math.floor(backup.createdAt / 1000)}:F>\n**Server:** ${backup.guildName}`,
            inline: true
          },
          {
            name: '📈 Data Breakdown',
            value: this.getBackupStatistics(backup.data),
            inline: false
          },
          {
            name: '🔧 Actions Available',
            value: '• Download as ZIP file\n• Restore to current server\n• Share with administrators\n• Delete permanently',
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Backup ID: ${backupId}`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        });

      await interaction.editReply({
        embeds: [infoEmbed],
        flags: [1 << 6]
      });

    } catch (error) {
      logError(`Failed to get backup info: ${error.message}`);
      await interaction.editReply({
        content: '❌ Failed to get backup information. Please try again.',
        flags: [1 << 6]
      });
    }
  }
}; 