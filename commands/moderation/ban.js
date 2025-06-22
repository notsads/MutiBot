const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for banning the user')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration for temporary ban (e.g., "2d1h30m40s")')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const duration = interaction.options.getString('duration');
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('The user is not in the server'),
        'User Not Found',
        [
          'The specified user is not a member of this server',
          'Check the username and try again',
          'Make sure the user hasn\'t already left the server'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const executor = interaction.member;
    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);

    // Permission checks
    if (!interaction.member.permissions.has('BanMembers')) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('You do not have BanMembers permission'),
        'Permission Denied',
        [
          'You need the "Ban Members" permission to use this command',
          'Contact a server administrator for assistance',
          'Make sure you have the correct role permissions'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (member.roles.highest.position >= executor.roles.highest.position) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('Cannot ban user with higher or equal role'),
        'Role Hierarchy Error',
        [
          'You cannot ban users with higher or equal roles',
          'Check the role hierarchy in server settings',
          'Contact a server administrator for assistance'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (member.roles.highest.position >= botMember.roles.highest.position) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('Bot cannot ban user with higher or equal role'),
        'Bot Permission Error',
        [
          'The bot cannot ban users with higher or equal roles',
          'Move the bot\'s role higher in the role hierarchy',
          'Contact a server administrator for assistance'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Duration validation
    const durationRegex = /^(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?$/;
    let durationInMs = null;

    if (duration) {
      if (!durationRegex.test(duration)) {
        const errorEmbed = UIUtils.createErrorEmbed(
          new Error('Invalid duration format'),
          'Duration Format Error',
          [
            'Use format: 1d2h30m40s (days, hours, minutes, seconds)',
            'Examples: 1d, 2h30m, 1d2h30m40s',
            'Leave empty for permanent ban'
        ]
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      durationInMs = this.parseDuration(duration);
    }

    // Create user info embed for confirmation
    const userInfoEmbed = UIUtils.createAnimatedEmbed(
      '⚠️ Ban Confirmation',
      `Are you sure you want to ban **${user.tag}**?`,
      UIUtils.colors.warning,
      'warning',
      [
        {
          name: '👤 User Information',
          value: `**Username:** ${user.tag}\n**ID:** \`${user.id}\`\n**Joined:** ${UIUtils.createTimestamp(member.joinedAt)}\n**Account Created:** ${UIUtils.createTimestamp(user.createdAt)}`,
          inline: true
        },
        {
          name: '🎭 Role Information',
          value: `**Highest Role:** ${member.roles.highest}\n**Role Count:** ${member.roles.cache.size - 1}\n**Color:** ${member.displayHexColor}\n**Nickname:** ${member.nickname || 'None'}`,
          inline: true
        },
        {
          name: '📋 Ban Details',
          value: `**Reason:** ${reason}\n**Duration:** ${durationInMs ? UIUtils.formatDuration(durationInMs) : 'Permanent'}\n**Banned by:** ${interaction.user.tag}`,
          inline: false
        },
        {
          name: '📊 User Statistics',
          value: `**Server Member Since:** ${UIUtils.createRelativeTimestamp(member.joinedAt)}\n**Account Age:** ${UIUtils.createRelativeTimestamp(user.createdAt)}\n**Status:** ${member.presence?.status || 'Unknown'}`,
          inline: false
        }
      ],
      {
        text: `Ban confirmation for ${user.tag}`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      },
      user.displayAvatarURL({ dynamic: true })
    );

    // Create confirmation dialog
    const { embed: confirmEmbed, buttons: confirmButtons } = UIUtils.createConfirmationDialog(
      'Confirm Ban',
      `Are you absolutely sure you want to ban **${user.tag}**?\n\nThis action cannot be undone immediately.`,
      '✅ Confirm Ban',
      '❌ Cancel'
    );

    const response = await interaction.reply({ 
      embeds: [userInfoEmbed, confirmEmbed], 
      components: [confirmButtons],
      fetchReply: true 
    });

    // Create collector for confirmation
    const filter = (i) => 
      (i.customId === 'confirm_action' || i.customId === 'cancel_action') && 
      i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 30000, // 30 seconds
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'confirm_action') {
        // Show processing state
        const processingEmbed = UIUtils.createAnimatedEmbed(
          '⏳ Processing Ban',
          `Banning ${user.tag}...`,
          UIUtils.colors.info,
          'loading'
        );

        await i.update({ embeds: [processingEmbed], components: [] });

        try {
          // Execute the ban
          await member.ban({ reason: `${reason} | Banned by ${interaction.user.tag}` });

          // Create success embed
          const banEmbed = UIUtils.createSuccessEmbed(
            'Member Banned Successfully',
            `⛔ **${user.tag}** has been banned from the server.`,
            [
              {
                name: '📋 Ban Details',
                value: `**Reason:** ${reason}\n**Duration:** ${durationInMs ? UIUtils.formatDuration(durationInMs) : 'Permanent'}\n**Banned by:** ${interaction.user.tag}`,
                inline: true
              },
              {
                name: '⏰ Ban Information',
                value: `**Banned at:** ${UIUtils.createTimestamp(new Date())}\n**Expires:** ${durationInMs ? UIUtils.createTimestamp(new Date(Date.now() + durationInMs)) : 'Never'}\n**User ID:** \`${user.id}\``,
                inline: true
              },
              {
                name: '🔗 Quick Actions',
                value: `• [View User Profile](https://discord.com/users/${user.id})\n• [Server Settings](https://discord.com/channels/${interaction.guild.id})\n• [Audit Log](https://discord.com/channels/${interaction.guild.id})`,
                inline: false
              }
            ],
            {
              text: `Banned by ${interaction.user.tag} • ${interaction.guild.name}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            }
          );

          // Create action buttons
          const actionButtons = UIUtils.createActionButtons([
            {
              id: 'unban_user',
              label: 'Unban User',
              emoji: '🔓',
              style: 'success'
            },
            {
              id: 'view_audit',
              label: 'View Audit Log',
              emoji: '📋',
              style: 'secondary'
            },
            {
              id: 'ban_history',
              label: 'Ban History',
              emoji: '📜',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [banEmbed], components: [actionButtons] });

          // Set up temporary ban timer if duration specified
          if (durationInMs) {
            setTimeout(async () => {
              try {
                await interaction.guild.members.unban(
                  user.id,
                  'Temporary ban duration expired'
                );
                
                // Send unban notification if possible
                const unbanEmbed = UIUtils.createInfoEmbed(
                  'Temporary Ban Expired',
                  `**${user.tag}**'s temporary ban has expired and they have been unbanned.`,
                  [
                    {
                      name: '⏰ Expiration Details',
                      value: `**Original Duration:** ${UIUtils.formatDuration(durationInMs)}\n**Expired at:** ${UIUtils.createTimestamp(new Date())}\n**User ID:** \`${user.id}\``,
                      inline: true
                    }
                  ],
                  {
                    text: `Automatic unban • ${interaction.guild.name}`,
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                  }
                );

                // Try to send to the original channel
                try {
                  await interaction.channel.send({ embeds: [unbanEmbed] });
                } catch (error) {
                  console.error('Failed to send unban notification:', error);
                }
              } catch (error) {
                console.error(`Failed to unban ${user.tag}:`, error);
              }
            }, durationInMs);
          }

        } catch (error) {
          const errorEmbed = UIUtils.createErrorEmbed(
            error,
            'Ban Failed',
            [
              'The ban operation failed',
              'Check bot permissions',
              'Ensure the user is still in the server'
            ]
          );
          await i.update({ embeds: [errorEmbed], components: [] });
        }

      } else if (i.customId === 'cancel_action') {
        const cancelEmbed = UIUtils.createInfoEmbed(
          'Ban Cancelled',
          `Ban operation for **${user.tag}** has been cancelled.`,
          [],
          {
            text: `Cancelled by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          }
        );
        await i.update({ embeds: [cancelEmbed], components: [] });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        // No interaction occurred, disable buttons
        const disabledButtons = UIUtils.createActionButtons([
          {
            id: 'confirm_action',
            label: 'Confirm Ban',
            emoji: '✅',
            style: 'success',
            disabled: true
          },
          {
            id: 'cancel_action',
            label: 'Cancel',
            emoji: '❌',
            style: 'danger',
            disabled: true
          }
        ]);
        
        interaction.editReply({
          components: [disabledButtons],
        }).catch(() => {});
      }
    });
  },

  parseDuration(duration) {
    const days = (duration.match(/(\d+)d/) ? parseInt(duration.match(/(\d+)d/)[1], 10) : 0) * 24 * 60 * 60 * 1000;
    const hours = (duration.match(/(\d+)h/) ? parseInt(duration.match(/(\d+)h/)[1], 10) : 0) * 60 * 60 * 1000;
    const minutes = (duration.match(/(\d+)m/) ? parseInt(duration.match(/(\d+)m/)[1], 10) : 0) * 60 * 1000;
    const seconds = (duration.match(/(\d+)s/) ? parseInt(duration.match(/(\d+)s/)[1], 10) : 0) * 1000;

    return days + hours + minutes + seconds;
  }
};
