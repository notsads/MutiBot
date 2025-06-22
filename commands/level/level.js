const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { MemberData, GuildSettings } = require('../../models/Level');
const CanvasUtils = require('../../utils/canvasUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your level and XP with beautiful graphics.')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to check.')
    ),
  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const guildData = await GuildSettings.findOne({
      guildId: interaction.guild.id,
    });

    if (!guildData) {
      return interaction.editReply({
        content:
          'Leveling system is not configured for this server yet. Please ask an admin to set it up.',
        flags: 64,
      });
    }

    if (!guildData.levelingEnabled) {
      return interaction.editReply({
        content: 'Leveling system is not enabled in this Server',
        flags: 64,
      });
    }

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const statusTarget =
      interaction.options.getMember('user') || interaction.member;

    const memberData = await MemberData.findOne({
      guildId: interaction.guild.id,
      userId: targetUser.id,
    });

    if (!memberData) {
      return interaction.editReply({
        content: `${targetUser.username} has no level data.`,
        flags: 64,
      });
    }

    const xpNeeded = this.calculateXpNeeded(memberData.level, guildData);
    const progress = (memberData.xp / xpNeeded) * 100;
    const leaderboardRank = await this.getLeaderboardRank(
      interaction.guild.id,
      memberData.level,
      memberData.xp
    );

    try {
      // Create beautiful level card using CanvasUtils
      const canvas = await this.createLevelCard(
        targetUser,
        memberData,
        xpNeeded,
        progress,
        leaderboardRank,
        interaction.guild
      );

      const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {
        name: 'level.png',
      });

      // Create enhanced embed
      const levelEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('📊 Level Information')
        .setDescription(`**${targetUser.username}**'s level statistics`)
        .addFields(
          {
            name: '🏆 Level & Rank',
            value: `**Level:** ${memberData.level}\n**Rank:** #${leaderboardRank}`,
            inline: true
          },
          {
            name: '📈 XP Progress',
            value: `**Current XP:** ${memberData.xp.toLocaleString()}\n**XP Needed:** ${xpNeeded.toLocaleString()}`,
            inline: true
          },
          {
            name: '📊 Total Stats',
            value: `**Total XP:** ${memberData.totalXp.toLocaleString()}\n**Progress:** ${progress.toFixed(1)}%`,
            inline: true
          }
        )
        .setImage('attachment://level.png')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: `${interaction.guild.name} • Level System`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [levelEmbed], files: [attachment] });
    } catch (error) {
      console.error('Error creating level card:', error);
      return interaction.editReply({
        content: 'Failed to generate level card. Please try again.',
        flags: 64,
      });
    }
  },

  async createLevelCard(user, memberData, xpNeeded, progress, rank, guild) {
    const canvas = require('canvas').createCanvas(1200, 400);
    const ctx = canvas.getContext('2d');

    // Create beautiful background
    CanvasUtils.createBackground(ctx, canvas.width, canvas.height);
    CanvasUtils.addParticles(ctx, canvas.width, canvas.height, 25);
    CanvasUtils.addGeometricShapes(ctx, canvas.width, canvas.height, 0.08);

    // Draw avatar
    const avatarX = 80;
    const avatarY = canvas.height / 2;
    const avatarRadius = 80;
    
    await CanvasUtils.drawAvatar(ctx, user.displayAvatarURL({ extension: 'png', size: 256 }), avatarX, avatarY, avatarRadius);

    // Draw username with gradient
    CanvasUtils.drawText(ctx, user.username, 200, 120, {
      font: 'bold 50px Poppins-Bold',
      gradient: CanvasUtils.createGradient(ctx, 200, 100, 600, 100, ['#ff6b6b', '#4ecdc4', '#45b7d1']),
      align: 'left'
    });

    // Draw level and rank
    CanvasUtils.drawText(ctx, `Level ${memberData.level}`, 200, 160, {
      font: 'bold 40px Poppins-Bold',
      color: 'rgba(255, 255, 255, 0.9)',
      align: 'left'
    });

    CanvasUtils.drawText(ctx, `Rank #${rank}`, 400, 160, {
      font: 'bold 40px Poppins-Bold',
      color: 'rgba(255, 255, 255, 0.8)',
      align: 'left'
    });

    // Draw progress bar
    CanvasUtils.drawProgressBar(ctx, 200, 200, 400, 25, progress);

    // Draw XP information
    CanvasUtils.drawText(ctx, `${memberData.xp.toLocaleString()}/${xpNeeded.toLocaleString()} XP`, 200, 240, {
      font: '20px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.8)',
      align: 'left'
    });

    CanvasUtils.drawText(ctx, `${progress.toFixed(1)}% Complete`, 400, 240, {
      font: '20px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.7)',
      align: 'left'
    });

    // Draw total XP
    CanvasUtils.drawText(ctx, `Total XP: ${memberData.totalXp.toLocaleString()}`, 200, 270, {
      font: '18px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.6)',
      align: 'left'
    });

    // Draw server name
    CanvasUtils.drawText(ctx, guild.name, canvas.width - 30, canvas.height - 30, {
      font: '18px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.7)',
      align: 'right'
    });

    // Add sparkles around avatar
    CanvasUtils.addSparkles(ctx, avatarX, avatarY, avatarRadius + 30, 8);

    return canvas;
  },

  calculateXpNeeded(level, guildData) {
    if (level === 1) return guildData.startingXp || 100;
    return (
      (guildData.startingXp || 100) +
      (level - 1) * (guildData.xpPerLevel || 50)
    );
  },

  async getLeaderboardRank(guildId, level, xp) {
    const members = await MemberData.find({ guildId })
      .sort({ level: -1, xp: -1 })
      .lean();

    const rank = members.findIndex(
      (member) => member.level === level && member.xp === xp
    );

    return rank + 1;
  },
};
