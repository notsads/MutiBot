const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const CanvasUtils = require('../utils/canvasUtils');
const Welcome = require('../models/welcome');
const AutoRole = require('../models/AutoRoles');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      const autoRole = await AutoRole.findOne({ serverId: member.guild.id });
      const welcomeData = await Welcome.findOne({ serverId: member.guild.id });

      if (!welcomeData || !welcomeData.enabled || !welcomeData.channelId)
        return;

      // Create welcome card using CanvasUtils
      const canvas = await CanvasUtils.createWelcomeCard(member, member.guild);

      // Process welcome message
      let description =
        welcomeData.description || 'Welcome {member} to {server}';
      description = description
        .replace(/{member}/g, member.user)
        .replace(/{server}/g, member.guild.name)
        .replace(/{serverid}/g, member.guild.id)
        .replace(/{userid}/g, member.user.id)
        .replace(
          /{joindate}/g,
          `<t:${Math.floor((member.joinedAt || Date.now()) / 1000)}:F>`
        )
        .replace(
          /{accountage}/g,
          `<t:${Math.floor(member.user.createdAt / 1000)}:R>`
        )
        .replace(/{membercount}/g, member.guild.memberCount)
        .replace(
          /{serverage}/g,
          `<t:${Math.floor(member.guild.createdAt / 1000)}:R>`
        );

      // Send welcome image with enhanced embed
      const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {
        name: 'welcome.png',
      });
      
      const welcomeChannel = member.guild.channels.cache.get(
        welcomeData.channelId
      );
      
      if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x4ECDC4)
          .setTitle('🎉 Welcome to the Server!')
          .setDescription(description)
          .addFields(
            {
              name: '👤 Member Info',
              value: `**Username:** ${member.user.tag}\n**Account Created:** <t:${Math.floor(member.user.createdAt / 1000)}:R>\n**Member #${member.guild.memberCount}**`,
              inline: true
            },
            {
              name: '📊 Server Stats',
              value: `**Total Members:** ${member.guild.memberCount}\n**Server Created:** <t:${Math.floor(member.guild.createdAt / 1000)}:R>`,
              inline: true
            }
          )
          .setImage('attachment://welcome.png')
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: `Welcome to ${member.guild.name}`,
            iconURL: member.guild.iconURL({ dynamic: true })
          })
          .setTimestamp();

        welcomeChannel.send({ embeds: [welcomeEmbed], files: [attachment] });
      }

      // Assign auto roles
      if (!autoRole || autoRole.roleIds.length === 0) return;
      for (const roleId of autoRole.roleIds) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          try {
            await member.roles.add(role);
          } catch (error) {
            console.error('Failed to assign role:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling guildMemberAdd:', error);
    }
  },
};
