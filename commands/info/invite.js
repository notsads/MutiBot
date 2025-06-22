const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get invite links for the bot with different permission presets.'),

  async execute(interaction) {
    await interaction.deferReply();

    const client = interaction.client;
    const botUser = client.user;

    // Create different invite links with different permission presets
    const inviteLinks = {
      admin: `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=8&scope=bot%20applications.commands`,
      moderate: `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=402653184&scope=bot%20applications.commands`,
      basic: `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=2147483648&scope=bot%20applications.commands`,
      custom: `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=0&scope=bot%20applications.commands`
    };

    // Create main embed
    const mainEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`🤖 Invite ${botUser.username}`)
      .setDescription(`Choose the perfect invite link for your server!`)
      .setThumbnail(botUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '🔗 Quick Invite Options',
          value: 'Select from our pre-configured permission presets below, or create a custom invite with your preferred permissions.',
          inline: false
        },
        {
          name: '📊 Bot Statistics',
          value: `**Servers:** ${client.guilds.cache.size.toLocaleString()}\n**Users:** ${client.users.cache.size.toLocaleString()}\n**Commands:** ${client.application?.commands.cache.size || 0}\n**Uptime:** <t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`,
          inline: true
        },
        {
          name: '⚡ Features',
          value: '• Advanced Moderation\n• Level System\n• Music Player\n• Welcome System\n• Auto-Roles\n• Ticket System\n• And much more!',
          inline: true
        }
      )
      .setFooter({
        text: `${botUser.username} • Invite System`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create permission presets embed
    const presetsEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`🔧 Permission Presets`)
      .setDescription(`Choose the right permission level for your server:`)
      .addFields(
        {
          name: '👑 Administrator',
          value: '**Full access** to all bot features\n• All permissions enabled\n• Recommended for trusted bots\n• Complete server management',
          inline: false
        },
        {
          name: '🛡️ Moderator',
          value: '**Moderation-focused** permissions\n• Kick, ban, manage messages\n• Manage roles and channels\n• Safe for most servers',
          inline: false
        },
        {
          name: '📝 Basic',
          value: '**Minimal permissions** only\n• Send messages and embeds\n• Read message history\n• Safe for any server',
          inline: false
        },
        {
          name: '⚙️ Custom',
          value: '**Choose your own** permissions\n• Select exactly what you need\n• Maximum control and security\n• For advanced users',
          inline: false
        }
      )
      .setFooter({
        text: `${botUser.username} • Permission Guide`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create support embed
    const supportEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`🆘 Support & Resources`)
      .setDescription(`Need help with ${botUser.username}? Here are some useful resources:`)
      .addFields(
        {
          name: '📚 Documentation',
          value: '• Command guide and tutorials\n• Setup instructions\n• Configuration help\n• Troubleshooting tips',
          inline: true
        },
        {
          name: '💬 Community',
          value: '• Join our support server\n• Ask questions\n• Share feedback\n• Report bugs',
          inline: true
        },
        {
          name: '🔧 Configuration',
          value: '• Server settings guide\n• Permission explanations\n• Feature customization\n• Best practices',
          inline: false
        }
      )
      .setFooter({
        text: `${botUser.username} • Support Center`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create action buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('main')
          .setLabel('Main Info')
          .setEmoji('🤖')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('presets')
          .setLabel('Permission Presets')
          .setEmoji('🔧')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('support')
          .setLabel('Support')
          .setEmoji('🆘')
          .setStyle(ButtonStyle.Secondary)
      );

    // Create invite buttons
    const inviteButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_invite')
          .setLabel('Administrator')
          .setEmoji('👑')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('moderate_invite')
          .setLabel('Moderator')
          .setEmoji('🛡️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('basic_invite')
          .setLabel('Basic')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('custom_invite')
          .setLabel('Custom')
          .setEmoji('⚙️')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send initial response
    const response = await interaction.editReply({
      embeds: [mainEmbed],
      components: [buttons, inviteButtons]
    });

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 5 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This menu is not for you!', ephemeral: true });
      }

      let embed;
      let showInviteButtons = false;

      switch (i.customId) {
        case 'main':
          embed = mainEmbed;
          showInviteButtons = true;
          break;
        case 'presets':
          embed = presetsEmbed;
          break;
        case 'support':
          embed = supportEmbed;
          break;
        case 'admin_invite':
          await i.reply({ 
            content: `🔗 **Administrator Invite Link:**\n${inviteLinks.admin}\n\n⚠️ **Warning:** This gives the bot full administrator access. Only use if you trust the bot completely.`, 
            ephemeral: true 
          });
          return;
        case 'moderate_invite':
          await i.reply({ 
            content: `🔗 **Moderator Invite Link:**\n${inviteLinks.moderate}\n\n✅ **Recommended:** This gives the bot moderation permissions for safe server management.`, 
            ephemeral: true 
          });
          return;
        case 'basic_invite':
          await i.reply({ 
            content: `🔗 **Basic Invite Link:**\n${inviteLinks.basic}\n\n🛡️ **Safe:** This gives the bot minimal permissions for basic functionality.`, 
            ephemeral: true 
          });
          return;
        case 'custom_invite':
          await i.reply({ 
            content: `🔗 **Custom Invite Link:**\n${inviteLinks.custom}\n\n⚙️ **Custom:** You can select specific permissions when using this link.`, 
            ephemeral: true 
          });
          return;
      }

      // Update button states
      const updatedButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Info')
            .setEmoji('🤖')
            .setStyle(i.customId === 'main' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('presets')
            .setLabel('Permission Presets')
            .setEmoji('🔧')
            .setStyle(i.customId === 'presets' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('support')
            .setLabel('Support')
            .setEmoji('🆘')
            .setStyle(i.customId === 'support' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

      const components = [updatedButtons];
      if (showInviteButtons) {
        components.push(inviteButtons);
      }

      await i.update({
        embeds: [embed],
        components: components
      });
    });

    collector.on('end', async () => {
      const disabledButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Info')
            .setEmoji('🤖')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('presets')
            .setLabel('Permission Presets')
            .setEmoji('🔧')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('support')
            .setLabel('Support')
            .setEmoji('🆘')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

      const disabledInviteButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('admin_invite')
            .setLabel('Administrator')
            .setEmoji('👑')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('moderate_invite')
            .setLabel('Moderator')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('basic_invite')
            .setLabel('Basic')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('custom_invite')
            .setLabel('Custom')
            .setEmoji('⚙️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

      try {
        await response.edit({
          components: [disabledButtons, disabledInviteButtons]
        });
      } catch (error) {
        console.error('Error disabling buttons:', error);
      }
    });
  },
};
