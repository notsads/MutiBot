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
    .setName('userinfo')
    .setDescription('Displays detailed information about a user with advanced features.')
    .addUserOption((option) =>
      option.setName('target').setDescription('Select a user to view information about')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

    // Calculate user statistics
    const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id);
    const permissions = member.permissions.toArray();
    const keyPermissions = permissions.filter(perm => 
      ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'KickMembers', 'BanMembers'].includes(perm)
    );

    // Create main embed
    const mainEmbed = new EmbedBuilder()
      .setColor(member.displayHexColor === '#000000' ? 0x5865f2 : member.displayHexColor)
      .setTitle(`👤 ${user.username}'s Profile`)
      .setDescription(`**${user.username}** is a member of **${interaction.guild.name}**`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '🆔 User Information',
          value: `**Username:** ${user.username}\n**Display Name:** ${member.displayName}\n**User ID:** \`${user.id}\`\n**Bot:** ${user.bot ? 'Yes' : 'No'}`,
          inline: true
        },
        {
          name: '📅 Account Details',
          value: `**Created:** <t:${Math.floor(user.createdAt / 1000)}:R>\n**Joined Server:** <t:${Math.floor(member.joinedAt / 1000)}:R>\n**Account Age:** <t:${Math.floor(user.createdAt / 1000)}:D>`,
          inline: true
        },
        {
          name: '🎨 Appearance',
          value: `**Nickname:** ${member.nickname || 'None'}\n**Color:** ${member.displayHexColor}\n**Avatar:** [View Avatar](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`,
          inline: true
        },
        {
          name: '👑 Roles & Permissions',
          value: `**Roles:** ${roles.size}\n**Key Permissions:** ${keyPermissions.length > 0 ? keyPermissions.slice(0, 3).join(', ') : 'None'}\n**Highest Role:** ${member.roles.highest}`,
          inline: true
        },
        {
          name: '📊 Server Stats',
          value: `**Member #${interaction.guild.members.cache.sort((a, b) => a.joinedAt - b.joinedAt).keyArray().indexOf(member.id) + 1}**\n**Boosting:** ${member.premiumSince ? `<t:${Math.floor(member.premiumSince / 1000)}:R>` : 'No'}\n**Status:** ${member.presence?.status || 'Unknown'}`,
          inline: true
        },
        {
          name: '🔧 Management',
          value: `**Manageable:** ${member.manageable ? 'Yes' : 'No'}\n**Kickable:** ${member.kickable ? 'Yes' : 'No'}\n**Bannable:** ${member.bannable ? 'Yes' : 'No'}`,
          inline: true
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag} • ${interaction.guild.name}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create roles embed
    const rolesEmbed = new EmbedBuilder()
      .setColor(member.displayHexColor === '#000000' ? 0x5865f2 : member.displayHexColor)
      .setTitle(`🎭 ${user.username}'s Roles`)
      .setDescription(roles.size > 0 ? 
        roles.map(role => `${role} - ${role.members.size} members`).join('\n') : 
        'This user has no roles.'
      )
      .addFields(
        {
          name: '📈 Role Statistics',
          value: `**Total Roles:** ${roles.size}\n**Highest Role:** ${member.roles.highest}\n**Color Roles:** ${roles.filter(r => r.color !== 0).size}`,
          inline: true
        },
        {
          name: '🔐 Key Permissions',
          value: keyPermissions.length > 0 ? 
            keyPermissions.map(perm => `• ${perm}`).join('\n') : 
            'No key permissions',
          inline: true
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Role Information`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    // Create permissions embed
    const permissionsEmbed = new EmbedBuilder()
      .setColor(member.displayHexColor === '#000000' ? 0x5865f2 : member.displayHexColor)
      .setTitle(`🔐 ${user.username}'s Permissions`)
      .setDescription(`Detailed permission breakdown for ${user.username}`)
      .addFields(
        {
          name: '⚡ Key Permissions',
          value: keyPermissions.length > 0 ? 
            keyPermissions.map(perm => `✅ ${perm}`).join('\n') : 
            'No key permissions',
          inline: false
        },
        {
          name: '📋 All Permissions',
          value: permissions.length > 0 ? 
            permissions.slice(0, 15).map(perm => `• ${perm}`).join('\n') + (permissions.length > 15 ? `\n... and ${permissions.length - 15} more` : '') : 
            'No permissions',
          inline: false
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Permission Analysis`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    // Create action buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('main')
          .setLabel('Main Info')
          .setEmoji('👤')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('roles')
          .setLabel('Roles')
          .setEmoji('🎭')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('permissions')
          .setLabel('Permissions')
          .setEmoji('🔐')
          .setStyle(ButtonStyle.Secondary)
      );

    // Add management buttons if user has permissions
    if (interaction.member.permissions.has(PermissionFlagsBits.ManageMembers) && member.manageable) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('kick')
          .setLabel('Kick User')
          .setEmoji('👢')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!member.kickable),
        new ButtonBuilder()
          .setCustomId('ban')
          .setLabel('Ban User')
          .setEmoji('🔨')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!member.bannable)
      );
    }

    // Send initial response
    const response = await interaction.editReply({
      embeds: [mainEmbed],
      components: [buttons]
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
      let disabled = false;

      switch (i.customId) {
        case 'main':
          embed = mainEmbed;
          break;
        case 'roles':
          embed = rolesEmbed;
          break;
        case 'permissions':
          embed = permissionsEmbed;
          break;
        case 'kick':
          if (!i.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return i.reply({ content: '❌ You need Kick Members permission!', ephemeral: true });
          }
          await i.reply({ content: `Are you sure you want to kick ${user.username}? Use \`/kick ${user.id}\` to confirm.`, ephemeral: true });
          return;
        case 'ban':
          if (!i.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return i.reply({ content: '❌ You need Ban Members permission!', ephemeral: true });
          }
          await i.reply({ content: `Are you sure you want to ban ${user.username}? Use \`/ban ${user.id}\` to confirm.`, ephemeral: true });
          return;
      }

      // Update button states
      const updatedButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Info')
            .setEmoji('👤')
            .setStyle(i.customId === 'main' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('roles')
            .setLabel('Roles')
            .setEmoji('🎭')
            .setStyle(i.customId === 'roles' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('permissions')
            .setLabel('Permissions')
            .setEmoji('🔐')
            .setStyle(i.customId === 'permissions' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

      // Add management buttons if user has permissions
      if (interaction.member.permissions.has(PermissionFlagsBits.ManageMembers) && member.manageable) {
        updatedButtons.addComponents(
          new ButtonBuilder()
            .setCustomId('kick')
            .setLabel('Kick User')
            .setEmoji('👢')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!member.kickable),
          new ButtonBuilder()
            .setCustomId('ban')
            .setLabel('Ban User')
            .setEmoji('🔨')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!member.bannable)
        );
      }

      await i.update({
        embeds: [embed],
        components: [updatedButtons]
      });
    });

    collector.on('end', async () => {
      const disabledButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Info')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('roles')
            .setLabel('Roles')
            .setEmoji('🎭')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('permissions')
            .setLabel('Permissions')
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

      try {
        await response.edit({
          components: [disabledButtons]
        });
      } catch (error) {
        console.error('Error disabling buttons:', error);
      }
    });
  },
};
