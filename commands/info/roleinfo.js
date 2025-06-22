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
    .setName('roleinfo')
    .setDescription('Displays detailed information about a specific role with advanced features.')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The role to get detailed information about')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const role = interaction.options.getRole('role');
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

    // Calculate role statistics
    const permissions = role.permissions.toArray();
    const keyPermissions = permissions.filter(perm => 
      ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'KickMembers', 'BanMembers', 'ManageMessages'].includes(perm)
    );
    const memberCount = role.members.size;
    const botCount = role.members.filter(member => member.user.bot).size;
    const humanCount = memberCount - botCount;

    // Create main embed
    const mainEmbed = new EmbedBuilder()
      .setColor(role.color === 0 ? 0x5865f2 : role.color)
      .setTitle(`🎭 ${role.name} Role Information`)
      .setDescription(`Detailed information about the **${role.name}** role`)
      .addFields(
        {
          name: '🆔 Basic Information',
          value: `**Name:** ${role.name}\n**ID:** \`${role.id}\`\n**Color:** ${role.hexColor}\n**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}`,
          inline: true
        },
        {
          name: '📊 Member Statistics',
          value: `**Total Members:** ${memberCount}\n**Humans:** ${humanCount}\n**Bots:** ${botCount}\n**Position:** ${role.position}`,
          inline: true
        },
        {
          name: '⚙️ Role Settings',
          value: `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n**Managed:** ${role.managed ? 'Yes' : 'No'}\n**Created:** <t:${Math.floor(role.createdAt / 1000)}:R>`,
          inline: true
        },
        {
          name: '🔐 Key Permissions',
          value: keyPermissions.length > 0 ? 
            keyPermissions.slice(0, 3).map(perm => `• ${perm}`).join('\n') : 
            'No key permissions',
          inline: true
        },
        {
          name: '📈 Role Hierarchy',
          value: `**Position:** ${role.position}/${interaction.guild.roles.cache.size}\n**Above Bot:** ${role.position > botMember.roles.highest.position ? 'Yes' : 'No'}\n**Editable:** ${role.editable ? 'Yes' : 'No'}`,
          inline: true
        },
        {
          name: '🎨 Visual Properties',
          value: `**Color:** ${role.hexColor}\n**Icon:** ${role.icon ? 'Yes' : 'No'}\n**Unicode Emoji:** ${role.unicodeEmoji || 'None'}`,
          inline: true
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag} • ${interaction.guild.name}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create members embed
    const membersEmbed = new EmbedBuilder()
      .setColor(role.color === 0 ? 0x5865f2 : role.color)
      .setTitle(`👥 ${role.name} Members`)
      .setDescription(`Members with the **${role.name}** role`)
      .addFields(
        {
          name: '�� Member Breakdown',
          value: `**Total Members:** ${memberCount}\n**Humans:** ${humanCount}\n**Bots:** ${botCount}\n**Percentage:** ${((memberCount / interaction.guild.memberCount) * 100).toFixed(1)}%`,
          inline: true
        },
        {
          name: '👑 Top Members',
          value: memberCount > 0 ? 
            role.members.first(5).map(member => 
              `${member.user.username}${member.user.bot ? ' 🤖' : ''}`
            ).join('\n') + (memberCount > 5 ? `\n... and ${memberCount - 5} more` : '') : 
            'No members',
          inline: true
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Member Analysis`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    // Create permissions embed
    const permissionsEmbed = new EmbedBuilder()
      .setColor(role.color === 0 ? 0x5865f2 : role.color)
      .setTitle(`🔐 ${role.name} Permissions`)
      .setDescription(`Detailed permission breakdown for **${role.name}**`)
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
        },
        {
          name: '⚠️ Permission Analysis',
          value: `**Administrator:** ${role.permissions.has(PermissionFlagsBits.Administrator) ? 'Yes ⚠️' : 'No'}\n**Manage Guild:** ${role.permissions.has(PermissionFlagsBits.ManageGuild) ? 'Yes ⚠️' : 'No'}\n**Manage Roles:** ${role.permissions.has(PermissionFlagsBits.ManageRoles) ? 'Yes ⚠️' : 'No'}`,
          inline: true
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Permission Analysis`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    // Create management embed
    const managementEmbed = new EmbedBuilder()
      .setColor(role.color === 0 ? 0x5865f2 : role.color)
      .setTitle(`⚙️ ${role.name} Management`)
      .setDescription(`Management options and information for **${role.name}**`)
      .addFields(
        {
          name: '🔧 Role Management',
          value: `**Editable:** ${role.editable ? 'Yes' : 'No'}\n**Deletable:** ${role.deletable ? 'Yes' : 'No'}\n**Managed:** ${role.managed ? 'Yes' : 'No'}`,
          inline: true
        },
        {
          name: '📊 Hierarchy Info',
          value: `**Position:** ${role.position}\n**Above Bot:** ${role.position > botMember.roles.highest.position ? 'Yes' : 'No'}\n**Below User:** ${role.position < interaction.member.roles.highest.position ? 'Yes' : 'No'}`,
          inline: true
        },
        {
          name: '🎯 Quick Actions',
          value: role.editable ? 
            '• Edit role settings\n• Change color/name\n• Modify permissions\n• Manage members' : 
            '• Role cannot be edited\n• Contact server admin\n• Check permissions',
          inline: false
        }
      )
      .setFooter({
        text: `${interaction.guild.name} • Management Panel`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    // Create action buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('main')
          .setLabel('Main Info')
          .setEmoji('🎭')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('members')
          .setLabel('Members')
          .setEmoji('👥')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('permissions')
          .setLabel('Permissions')
          .setEmoji('🔐')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('management')
          .setLabel('Management')
          .setEmoji('⚙️')
          .setStyle(ButtonStyle.Secondary)
      );

    // Add management buttons if user has permissions
    if (interaction.member.permissions.has(PermissionFlagsBits.ManageRoles) && role.editable) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('edit')
          .setLabel('Edit Role')
          .setEmoji('✏️')
          .setStyle(ButtonStyle.Success)
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

      switch (i.customId) {
        case 'main':
          embed = mainEmbed;
          break;
        case 'members':
          embed = membersEmbed;
          break;
        case 'permissions':
          embed = permissionsEmbed;
          break;
        case 'management':
          embed = managementEmbed;
          break;
        case 'edit':
          if (!i.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return i.reply({ content: '❌ You need Manage Roles permission!', ephemeral: true });
          }
          await i.reply({ content: `To edit the ${role.name} role, use the server settings or contact an administrator.`, ephemeral: true });
          return;
      }

      // Update button states
      const updatedButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Info')
            .setEmoji('🎭')
            .setStyle(i.customId === 'main' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('members')
            .setLabel('Members')
            .setEmoji('👥')
            .setStyle(i.customId === 'members' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('permissions')
            .setLabel('Permissions')
            .setEmoji('🔐')
            .setStyle(i.customId === 'permissions' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('management')
            .setLabel('Management')
            .setEmoji('⚙️')
            .setStyle(i.customId === 'management' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

      // Add management buttons if user has permissions
      if (interaction.member.permissions.has(PermissionFlagsBits.ManageRoles) && role.editable) {
        updatedButtons.addComponents(
          new ButtonBuilder()
            .setCustomId('edit')
            .setLabel('Edit Role')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Success)
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
            .setEmoji('🎭')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('members')
            .setLabel('Members')
            .setEmoji('👥')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('permissions')
            .setLabel('Permissions')
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('management')
            .setLabel('Management')
            .setEmoji('⚙️')
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
