const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ComponentType,
  ChannelType
} = require('discord.js');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays detailed information about the server with advanced features.'),

  async execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    // Calculate server statistics
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
    const roles = guild.roles.cache.filter(r => r.id !== guild.id);
    const emojis = guild.emojis.cache;
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount;
    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const humanMembers = guild.members.cache.filter(m => !m.user.bot).size;
    const botMembers = guild.members.cache.filter(m => m.user.bot).size;

    // Calculate progress bars
    const memberProgress = UIUtils.createProgressBar(onlineMembers, totalMembers, 15, false);
    const boostProgress = UIUtils.createProgressBar(boostCount, 30, 15, false); // Max 30 boosts for level 3

    // Create main embed
    const mainEmbed = UIUtils.createAnimatedEmbed(
      `${guild.name} Server Information`,
      guild.description || `Welcome to **${guild.name}**!`,
      guild.ownerId === interaction.client.user.id ? UIUtils.colors.primary : guild.members.me.displayHexColor,
      'info',
      [
        {
          name: '🆔 Basic Information',
          value: `**Name:** ${guild.name}\n**ID:** \`${guild.id}\`\n**Owner:** ${owner}\n**Created:** ${UIUtils.createTimestamp(guild.createdAt)}`,
          inline: true
        },
        {
          name: '📊 Member Statistics',
          value: `**Total Members:** ${totalMembers.toLocaleString()}\n**Humans:** ${humanMembers.toLocaleString()}\n**Bots:** ${botMembers.toLocaleString()}\n**Online:** ${onlineMembers.toLocaleString()}`,
          inline: true
        },
        {
          name: '🎨 Server Features',
          value: `**Boost Level:** ${boostLevel}\n**Boost Count:** ${boostCount}\n**Verification:** ${guild.verificationLevel}\n**Explicit Content:** ${guild.explicitContentFilter}`,
          inline: true
        },
        {
          name: '📈 Member Activity',
          value: `**Online Rate:** ${memberProgress}\n**Activity:** ${((onlineMembers / totalMembers) * 100).toFixed(1)}%`,
          inline: false
        },
        {
          name: '📺 Channel Overview',
          value: `**Text Channels:** ${textChannels}\n**Voice Channels:** ${voiceChannels}\n**Categories:** ${categories}\n**Total:** ${channels.size}`,
          inline: true
        },
        {
          name: '🎭 Role & Emoji Stats',
          value: `**Roles:** ${roles.size}\n**Emojis:** ${emojis.size}\n**Stickers:** ${guild.stickers.cache.size}\n**Invites:** ${guild.invites.cache.size}`,
          inline: true
        }
      ],
      {
        text: `Requested by ${interaction.user.tag} • ${guild.name}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      },
      guild.iconURL({ dynamic: true, size: 256 })
    );

    // Create channels embed
    const channelsEmbed = UIUtils.createAnimatedEmbed(
      `${guild.name} Channels`,
      `Detailed channel breakdown for **${guild.name}**`,
      guild.ownerId === interaction.client.user.id ? UIUtils.colors.primary : guild.members.me.displayHexColor,
      'info',
      [
        {
          name: '💬 Text Channels',
          value: textChannels > 0 ? 
            guild.channels.cache.filter(c => c.type === ChannelType.GuildText).first(5).map(ch => 
              `• ${ch} (${ch.topic ? ch.topic.slice(0, 30) + '...' : 'No topic'})`
            ).join('\n') + (textChannels > 5 ? `\n... and ${textChannels - 5} more` : '') : 
            'No text channels',
          inline: true
        },
        {
          name: '🔊 Voice Channels',
          value: voiceChannels > 0 ? 
            guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).first(5).map(ch => 
              `• ${ch} (${ch.members.size} members)`
            ).join('\n') + (voiceChannels > 5 ? `\n... and ${voiceChannels - 5} more` : '') : 
            'No voice channels',
          inline: true
        },
        {
          name: '📊 Channel Statistics',
          value: `**Total Channels:** ${channels.size}\n**Text Channels:** ${textChannels}\n**Voice Channels:** ${voiceChannels}\n**Categories:** ${categories}\n**Announcement:** ${guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement).size}`,
          inline: false
        }
      ],
      {
        text: `${guild.name} • Channel Analysis`,
        iconURL: guild.iconURL({ dynamic: true })
      }
    );

    // Create roles embed
    const rolesEmbed = UIUtils.createAnimatedEmbed(
      `${guild.name} Roles`,
      `Role information for **${guild.name}**`,
      guild.ownerId === interaction.client.user.id ? UIUtils.colors.primary : guild.members.me.displayHexColor,
      'info',
      [
        {
          name: '📈 Role Statistics',
          value: `**Total Roles:** ${roles.size}\n**Color Roles:** ${roles.filter(r => r.color !== 0).size}\n**Hoisted Roles:** ${roles.filter(r => r.hoist).size}\n**Mentionable:** ${roles.filter(r => r.mentionable).size}`,
          inline: true
        },
        {
          name: '👑 Top Roles',
          value: roles.size > 0 ? 
            roles.sort((a, b) => b.position - a.position).first(5).map(role => 
              `• ${role} (${role.members.size} members)`
            ).join('\n') + (roles.size > 5 ? `\n... and ${roles.size - 5} more` : '') : 
            'No roles',
          inline: true
        },
        {
          name: '🔐 Key Roles',
          value: `**Administrator:** ${roles.filter(r => r.permissions.has('Administrator')).size}\n**Manage Guild:** ${roles.filter(r => r.permissions.has('ManageGuild')).size}\n**Manage Roles:** ${roles.filter(r => r.permissions.has('ManageRoles')).size}`,
          inline: true
        }
      ],
      {
        text: `${guild.name} • Role Analysis`,
        iconURL: guild.iconURL({ dynamic: true })
      }
    );

    // Create boost embed
    const boostEmbed = UIUtils.createAnimatedEmbed(
      `${guild.name} Boost Status`,
      `Server boost information for **${guild.name}**`,
      guild.ownerId === interaction.client.user.id ? UIUtils.colors.primary : guild.members.me.displayHexColor,
      'info',
      [
        {
          name: '⭐ Boost Level',
          value: `**Current Level:** ${boostLevel}\n**Boost Count:** ${boostCount}\n**Next Level:** ${boostLevel < 3 ? `${Math.ceil((boostCount + 1) / 2)} boosts needed` : 'Max level'}`,
          inline: true
        },
        {
          name: '📈 Boost Progress',
          value: `**Progress:** ${boostProgress}\n**Level ${boostLevel + 1}:** ${boostLevel < 3 ? `${boostCount}/${(boostLevel + 1) * 7}` : 'Maxed'}`,
          inline: true
        },
        {
          name: '🎁 Boost Benefits',
          value: boostLevel > 0 ? 
            `• ${boostLevel >= 1 ? '✅' : '❌'} 5 emoji slots\n• ${boostLevel >= 2 ? '✅' : '❌'} 100 emoji slots\n• ${boostLevel >= 3 ? '✅' : '❌'} 200 emoji slots\n• ${boostLevel >= 1 ? '✅' : '❌'} Animated server icon\n• ${boostLevel >= 2 ? '✅' : '❌'} Server banner\n• ${boostLevel >= 3 ? '✅' : '❌'} 384kbps audio` : 
            'No boosts yet',
          inline: true
        },
        {
          name: '📊 Boost Statistics',
          value: `**Total Boosters:** ${guild.members.cache.filter(m => m.premiumSince).size}\n**Boosters Online:** ${guild.members.cache.filter(m => m.premiumSince && m.presence?.status !== 'offline').size}\n**Boost Revenue:** $${(boostCount * 4.99).toFixed(2)}/month`,
          inline: true
        }
      ],
      {
        text: `${guild.name} • Boost Analysis`,
        iconURL: guild.iconURL({ dynamic: true })
      }
    );

    // Create detailed stats embed
    const statsEmbed = UIUtils.createStatsEmbed(
      `${guild.name} Detailed Statistics`,
      {
        '👥 Total Members': totalMembers.toLocaleString(),
        '🟢 Online Members': onlineMembers.toLocaleString(),
        '👤 Human Members': humanMembers.toLocaleString(),
        '🤖 Bot Members': botMembers.toLocaleString(),
        '📺 Total Channels': channels.size,
        '💬 Text Channels': textChannels,
        '🔊 Voice Channels': voiceChannels,
        '📁 Categories': categories,
        '🎭 Total Roles': roles.size,
        '😀 Total Emojis': emojis.size,
        '⭐ Boost Level': boostLevel,
        '🚀 Boost Count': boostCount
      },
      guild.ownerId === interaction.client.user.id ? UIUtils.colors.primary : guild.members.me.displayHexColor,
      {
        text: `${guild.name} • Comprehensive Statistics`,
        iconURL: guild.iconURL({ dynamic: true })
      }
    );

    // Create action buttons
    const actionButtons = UIUtils.createActionButtons([
      {
        id: 'main',
        label: 'Main Info',
        emoji: '🏠',
        style: 'primary'
      },
      {
        id: 'channels',
        label: 'Channels',
        emoji: '📺',
        style: 'secondary'
      },
      {
        id: 'roles',
        label: 'Roles',
        emoji: '🎭',
        style: 'secondary'
      },
      {
        id: 'boost',
        label: 'Boost Status',
        emoji: '🚀',
        style: 'secondary'
      },
      {
        id: 'stats',
        label: 'Statistics',
        emoji: '📊',
        style: 'secondary'
      }
    ]);

    // Add server management buttons if user has permissions
    if (interaction.member.permissions.has('ManageGuild')) {
      const managementButtons = UIUtils.createActionButtons([
        {
          id: 'invite',
          label: 'Invite',
          emoji: '🔗',
          style: 'success'
        },
        {
          id: 'settings',
          label: 'Settings',
          emoji: '⚙️',
          style: 'secondary'
        }
      ]);

      const response = await interaction.editReply({ 
        embeds: [mainEmbed], 
        components: [actionButtons, managementButtons] 
      });

      // Create collector for all buttons
      const filter = (i) => 
        (i.customId === 'main' || 
         i.customId === 'channels' || 
         i.customId === 'roles' || 
         i.customId === 'boost' ||
         i.customId === 'stats' ||
         i.customId === 'invite' ||
         i.customId === 'settings') && 
        i.user.id === interaction.user.id;

      const collector = response.createMessageComponentCollector({
        filter,
        time: 300000, // 5 minutes
      });

      collector.on('collect', async (i) => {
        let embed;
        let components = [actionButtons];

        switch (i.customId) {
          case 'main':
            embed = mainEmbed;
            break;
          case 'channels':
            embed = channelsEmbed;
            break;
          case 'roles':
            embed = rolesEmbed;
            break;
          case 'boost':
            embed = boostEmbed;
            break;
          case 'stats':
            embed = statsEmbed;
            break;
          case 'invite':
            const inviteEmbed = UIUtils.createSuccessEmbed(
              'Server Invite',
              `Invite link for **${guild.name}**`,
              [
                {
                  name: '🔗 Invite Link',
                  value: `[Click here to invite people to ${guild.name}](https://discord.gg/${guild.vanityURLCode || 'invite'})`,
                  inline: false
                },
                {
                  name: '📊 Invite Stats',
                  value: `**Uses:** ${guild.invites.cache.reduce((acc, invite) => acc + invite.uses, 0)}\n**Active Invites:** ${guild.invites.cache.size}`,
                  inline: true
                }
              ],
              {
                text: `${guild.name} • Invite Information`,
                iconURL: guild.iconURL({ dynamic: true })
              }
            );
            embed = inviteEmbed;
            break;
          case 'settings':
            const settingsEmbed = UIUtils.createInfoEmbed(
              'Server Settings',
              `Current settings for **${guild.name}**`,
              [
                {
                  name: '⚙️ General Settings',
                  value: `**Locale:** ${guild.preferredLocale}\n**AFK Timeout:** ${guild.afkTimeout / 60}min\n**System Channel:** ${guild.systemChannel || 'None'}\n**Rules Channel:** ${guild.rulesChannel || 'None'}`,
                  inline: true
                },
                {
                  name: '🔒 Security Settings',
                  value: `**Verification Level:** ${guild.verificationLevel}\n**Explicit Content Filter:** ${guild.explicitContentFilter}\n**2FA Requirement:** ${guild.mfaLevel === 1 ? 'Required' : 'Not Required'}`,
                  inline: true
                },
                {
                  name: '🎨 Appearance',
                  value: `**Server Icon:** ${guild.icon ? 'Set' : 'Not Set'}\n**Server Banner:** ${guild.banner ? 'Set' : 'Not Set'}\n**Splash Screen:** ${guild.splash ? 'Set' : 'Not Set'}`,
                  inline: true
                }
              ],
              {
                text: `${guild.name} • Settings Overview`,
                iconURL: guild.iconURL({ dynamic: true })
              }
            );
            embed = settingsEmbed;
            break;
        }

        if (i.customId === 'invite' || i.customId === 'settings') {
          components = [UIUtils.createActionButtons([
            {
              id: 'back_to_main',
              label: 'Back to Main',
              emoji: '🔙',
              style: 'secondary'
            }
          ])];
        } else {
          components = [actionButtons, managementButtons];
        }

        await i.update({ embeds: [embed], components: components });
      });

      collector.on('end', () => {
        // Disable all buttons when collector expires
        const disabledActionButtons = UIUtils.createActionButtons([
          {
            id: 'main',
            label: 'Main Info',
            emoji: '🏠',
            style: 'primary',
            disabled: true
          },
          {
            id: 'channels',
            label: 'Channels',
            emoji: '📺',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'roles',
            label: 'Roles',
            emoji: '🎭',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'boost',
            label: 'Boost Status',
            emoji: '🚀',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'stats',
            label: 'Statistics',
            emoji: '📊',
            style: 'secondary',
            disabled: true
          }
        ]);

        const disabledManagementButtons = UIUtils.createActionButtons([
          {
            id: 'invite',
            label: 'Invite',
            emoji: '🔗',
            style: 'success',
            disabled: true
          },
          {
            id: 'settings',
            label: 'Settings',
            emoji: '⚙️',
            style: 'secondary',
            disabled: true
          }
        ]);
        
        interaction.editReply({
          components: [disabledActionButtons, disabledManagementButtons],
        }).catch(() => {});
      });
    } else {
      // For users without management permissions
      const response = await interaction.editReply({ 
        embeds: [mainEmbed], 
        components: [actionButtons] 
      });

      const filter = (i) => 
        (i.customId === 'main' || 
         i.customId === 'channels' || 
         i.customId === 'roles' || 
         i.customId === 'boost' ||
         i.customId === 'stats') && 
        i.user.id === interaction.user.id;

      const collector = response.createMessageComponentCollector({
        filter,
        time: 300000, // 5 minutes
      });

      collector.on('collect', async (i) => {
        let embed;

        switch (i.customId) {
          case 'main':
            embed = mainEmbed;
            break;
          case 'channels':
            embed = channelsEmbed;
            break;
          case 'roles':
            embed = rolesEmbed;
            break;
          case 'boost':
            embed = boostEmbed;
            break;
          case 'stats':
            embed = statsEmbed;
            break;
        }

        await i.update({ embeds: [embed], components: [actionButtons] });
      });

      collector.on('end', () => {
        // Disable all buttons when collector expires
        const disabledButtons = UIUtils.createActionButtons([
          {
            id: 'main',
            label: 'Main Info',
            emoji: '🏠',
            style: 'primary',
            disabled: true
          },
          {
            id: 'channels',
            label: 'Channels',
            emoji: '📺',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'roles',
            label: 'Roles',
            emoji: '🎭',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'boost',
            label: 'Boost Status',
            emoji: '🚀',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'stats',
            label: 'Statistics',
            emoji: '📊',
            style: 'secondary',
            disabled: true
          }
        ]);
        
        interaction.editReply({
          components: [disabledButtons],
        }).catch(() => {});
      });
    }
  },
};
