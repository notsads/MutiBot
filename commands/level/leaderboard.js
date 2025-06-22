const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { MemberData, GuildSettings } = require('../../models/Level');
const CanvasUtils = require('../../utils/canvasUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server leaderboard with beautiful graphics.'),

  async execute(interaction) {
    await interaction.deferReply();

    const guildData = await GuildSettings.findOne({
      guildId: interaction.guild.id,
    });

    if (!guildData || !guildData.levelingEnabled) {
      return interaction.editReply({
        content: '❌ Leveling system is not enabled in this server.',
      });
    }

    const leaderboard = await MemberData.find({ guildId: interaction.guild.id })
      .sort({ level: -1, xp: -1 })
      .lean();

    if (leaderboard.length === 0) {
      return interaction.editReply({
        content: 'No members found in the leaderboard.',
      });
    }

    const topMembers = leaderboard.slice(0, 10);

    try {
      // Create beautiful leaderboard card
      const canvas = await this.createLeaderboardCard(topMembers, interaction.guild, interaction.client);

      const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {
        name: 'leaderboard.png',
      });

      // Create enhanced embed
      const leaderboardEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('🏆 Server Leaderboard')
        .setDescription(`Top ${topMembers.length} members by level and XP`)
        .addFields(
          {
            name: '📊 Statistics',
            value: `**Total Members:** ${leaderboard.length}\n**Top Level:** ${topMembers[0]?.level || 0}\n**Highest XP:** ${topMembers[0]?.xp?.toLocaleString() || 0}`,
            inline: true
          },
          {
            name: '🎯 Your Position',
            value: await this.getUserPosition(interaction.user.id, leaderboard),
            inline: true
          }
        )
        .setImage('attachment://leaderboard.png')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({
          text: `${interaction.guild.name} • Level Leaderboard`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [leaderboardEmbed], files: [attachment] });
    } catch (error) {
      console.error('Error creating leaderboard card:', error);
      return interaction.editReply({
        content: 'Failed to generate leaderboard. Please try again.',
      });
    }
  },

  async createLeaderboardCard(topMembers, guild, client) {
    const canvas = require('canvas').createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');

    // Create beautiful background
    CanvasUtils.createBackground(ctx, canvas.width, canvas.height);
    CanvasUtils.addParticles(ctx, canvas.width, canvas.height, 40);
    CanvasUtils.addGeometricShapes(ctx, canvas.width, canvas.height, 0.1);

    // Draw title
    CanvasUtils.drawText(ctx, 'LEADERBOARD', canvas.width / 2, 80, {
      font: 'bold 60px Poppins-Bold',
      gradient: CanvasUtils.createGradient(ctx, canvas.width * 0.2, 60, canvas.width * 0.8, 60, ['#ffffff', '#f8f9fa', '#e9ecef'])
    });

    // Draw server name
    CanvasUtils.drawText(ctx, guild.name, canvas.width / 2, 120, {
      font: '30px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.8)'
    });

    // Draw column headers
    const headers = ['Rank', 'User', 'Level', 'XP', 'Total XP'];
    const headerX = [50, 200, 500, 650, 800];
    
    headers.forEach((header, index) => {
      CanvasUtils.drawText(ctx, header, headerX[index], 180, {
        font: 'bold 24px Poppins-Bold',
        color: 'rgba(255, 255, 255, 0.9)',
        align: 'left'
      });
    });

    // Draw leaderboard rows
    for (let index = 0; index < topMembers.length; index++) {
      const member = topMembers[index];
      const y = 230 + index * 55;

      // Get user info
      let userTag = 'Unknown User';
      let avatarURL = 'https://cdn.discordapp.com/embed/avatars/0.png';

      try {
        const user = await client.users.fetch(member.userId);
        if (user) {
          userTag = user.username;
          avatarURL = user.displayAvatarURL({ format: 'png', size: 64 });
        }
      } catch (err) {
        console.error(`Failed to fetch user ${member.userId}:`, err);
      }

      // Draw rank with special styling for top 3
      const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
      const rankColor = index < 3 ? rankColors[index] : 'rgba(255, 255, 255, 0.8)';
      
      CanvasUtils.drawText(ctx, `#${index + 1}`, headerX[0], y, {
        font: 'bold 28px Poppins-Bold',
        color: rankColor,
        align: 'left'
      });

      // Draw avatar
      try {
        const avatar = await require('canvas').loadImage(avatarURL);
        const avatarSize = 40;
        const avatarX = headerX[1] - 20;
        const avatarY = y - 25;

        // Draw avatar background
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.restore();

        // Draw avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } catch (err) {
        console.warn(`Failed to load avatar for ${member.userId}: ${err.message}`);
        
        // Draw placeholder avatar
        const avatarSize = 40;
        const avatarX = headerX[1] - 20;
        const avatarY = y - 25;

        // Draw placeholder background
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.restore();

        // Draw placeholder circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#7289da';
        ctx.fill();
        ctx.restore();

        // Draw user icon
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', avatarX + avatarSize / 2, avatarY + avatarSize / 2);
        ctx.restore();
      }

      // Draw username
      CanvasUtils.drawText(ctx, userTag, headerX[1] + 50, y, {
        font: '24px Poppins-Regular',
        color: 'rgba(255, 255, 255, 0.9)',
        align: 'left'
      });

      // Draw level
      CanvasUtils.drawText(ctx, member.level.toString(), headerX[2], y, {
        font: 'bold 24px Poppins-Bold',
        color: 'rgba(255, 255, 255, 0.9)',
        align: 'left'
      });

      // Draw current XP
      CanvasUtils.drawText(ctx, member.xp.toLocaleString(), headerX[3], y, {
        font: '20px Poppins-Regular',
        color: 'rgba(255, 255, 255, 0.8)',
        align: 'left'
      });

      // Draw total XP
      CanvasUtils.drawText(ctx, member.totalXp.toLocaleString(), headerX[4], y, {
        font: '20px Poppins-Regular',
        color: 'rgba(255, 255, 255, 0.7)',
        align: 'left'
      });

      // Add sparkles for top 3
      if (index < 3) {
        const sparkleX = headerX[0] - 30;
        const sparkleY = y - 10;
        CanvasUtils.addSparkles(ctx, sparkleX, sparkleY, 20, 4, 0.6);
      }
    }

    // Draw decorative elements
    CanvasUtils.drawText(ctx, '🏆', 30, 80, {
      font: '40px Arial',
      color: '#FFD700',
      align: 'left'
    });

    // Add timestamp
    CanvasUtils.drawText(ctx, new Date().toLocaleDateString(), canvas.width - 30, canvas.height - 30, {
      font: '18px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.5)',
      align: 'right'
    });

    return canvas;
  },

  async getUserPosition(userId, leaderboard) {
    const userIndex = leaderboard.findIndex(member => member.userId === userId);
    if (userIndex === -1) {
      return '**Not ranked**';
    }
    
    const user = leaderboard[userIndex];
    const position = userIndex + 1;
    const suffix = this.getOrdinalSuffix(position);
    
    return `**Rank:** #${position}${suffix}\n**Level:** ${user.level}\n**XP:** ${user.xp.toLocaleString()}`;
  },

  getOrdinalSuffix(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
    switch (lastDigit) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  },
};
