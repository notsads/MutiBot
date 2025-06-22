const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memecollection')
    .setDescription('Manage your personal meme collection with save, view, and organize features.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your saved memes')
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Filter memes by category')
            .setRequired(false)
            .addChoices(
              { name: '🎭 Programming', value: 'programming' },
              { name: '🐕 Dogs', value: 'dogs' },
              { name: '🐱 Cats', value: 'cats' },
              { name: '🎮 Gaming', value: 'gaming' },
              { name: '😂 Dank', value: 'dank' },
              { name: '🎨 Art', value: 'art' },
              { name: '🎵 Music', value: 'music' },
              { name: '🍕 Food', value: 'food' },
              { name: '🌍 Random', value: 'random' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your meme collection statistics')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Export your meme collection as a list')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear your entire meme collection')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'view':
        await this.viewCollection(interaction);
        break;
      case 'stats':
        await this.showStats(interaction);
        break;
      case 'export':
        await this.exportCollection(interaction);
        break;
      case 'clear':
        await this.clearCollection(interaction);
        break;
    }
  },

  async viewCollection(interaction) {
    const category = interaction.options.getString('category');
    
    // Simulate user's meme collection (in a real implementation, this would come from a database)
    const userMemes = await this.getUserMemes(interaction.user.id, category);
    
    if (userMemes.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('📚 Your Meme Collection')
        .setDescription('You haven\'t saved any memes yet!')
        .addFields(
          {
            name: '💡 How to Save Memes',
            value: 'Use the `/meme` command and click the "Save Meme" button to add memes to your collection!',
            inline: false
          },
          {
            name: '🎯 Quick Actions',
            value: '• Browse memes with `/meme`\n• Create custom memes with `/memegenerator`\n• View your stats with `/memecollection stats`',
            inline: false
          }
        )
        .setFooter({
          text: 'Start building your collection today!',
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      return interaction.reply({
        embeds: [emptyEmbed],
        flags: [MessageFlags.Ephemeral]
      });
    }

    // Create collection embed
    const collectionEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📚 Your Meme Collection')
      .setDescription(`You have **${userMemes.length}** saved memes${category ? ` in the **${category}** category` : ''}`)
      .addFields(
        {
          name: '📊 Collection Info',
          value: `**Total Memes:** ${userMemes.length}\n**Categories:** ${this.getUniqueCategories(userMemes).length}\n**Latest Save:** ${this.getLatestSave(userMemes)}`,
          inline: true
        },
        {
          name: '🎯 Quick Actions',
          value: 'Use the buttons below to navigate and manage your collection!',
          inline: true
        }
      )
      .setFooter({
        text: `Collection of ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create navigation buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('Previous')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next')
          .setEmoji('➡️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('filter_category')
          .setLabel('Filter')
          .setEmoji('🔍')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('export_collection')
          .setLabel('Export')
          .setEmoji('📤')
          .setStyle(ButtonStyle.Success)
      );

    const response = await interaction.reply({
      embeds: [collectionEmbed],
      components: [buttons],
      fetchReply: true
    });

    // Create collector for navigation
    const collector = response.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });

    let currentPage = 0;
    const memesPerPage = 5;

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This collection is not for you!', flags: [MessageFlags.Ephemeral] });
      }

      switch (i.customId) {
        case 'prev_page':
          currentPage = Math.max(0, currentPage - 1);
          await this.updateCollectionView(i, userMemes, currentPage, memesPerPage, category);
          break;
        case 'next_page':
          currentPage = Math.min(Math.floor(userMemes.length / memesPerPage), currentPage + 1);
          await this.updateCollectionView(i, userMemes, currentPage, memesPerPage, category);
          break;
        case 'filter_category':
          await this.showCategoryFilter(i, response);
          break;
        case 'export_collection':
          await this.exportCollection(i);
          break;
      }
    });

    collector.on('end', async () => {
      const disabledButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('Previous')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('Next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('filter_category')
            .setLabel('Filter')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('export_collection')
            .setLabel('Export')
            .setEmoji('📤')
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

  async showStats(interaction) {
    // Simulate user's meme collection stats
    const stats = await this.getUserStats(interaction.user.id);
    
    const statsEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📊 Meme Collection Statistics')
      .setDescription(`Statistics for **${interaction.user.tag}**'s meme collection`)
      .addFields(
        {
          name: '📈 Collection Overview',
          value: `**Total Memes:** ${stats.totalMemes}\n**Categories:** ${stats.categories}\n**Average Rating:** ${stats.avgRating}\n**Collection Age:** ${stats.collectionAge}`,
          inline: true
        },
        {
          name: '🏆 Top Categories',
          value: this.formatTopCategories(stats.topCategories),
          inline: true
        },
        {
          name: '📅 Activity',
          value: `**This Week:** ${stats.thisWeek}\n**This Month:** ${stats.thisMonth}\n**Last Save:** ${stats.lastSave}`,
          inline: true
        },
        {
          name: '🎯 Achievements',
          value: this.getAchievements(stats),
          inline: false
        }
      )
      .setFooter({
        text: 'Keep collecting to unlock more achievements!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [statsEmbed],
      flags: [MessageFlags.Ephemeral]
    });
  },

  async exportCollection(interaction) {
    const userMemes = await this.getUserMemes(interaction.user.id);
    
    if (userMemes.length === 0) {
      return interaction.reply({
        content: '❌ You have no memes to export!',
        flags: [MessageFlags.Ephemeral]
      });
    }

    const exportEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📤 Meme Collection Export')
      .setDescription(`Exporting **${userMemes.length}** memes from your collection...`)
      .addFields(
        {
          name: '📋 Export Details',
          value: `**Format:** Text List\n**Total Items:** ${userMemes.length}\n**Categories:** ${this.getUniqueCategories(userMemes).length}`,
          inline: true
        },
        {
          name: '💾 Export Options',
          value: '• **Full List** - All memes with details\n• **Category Summary** - Memes grouped by category\n• **URLs Only** - Just the meme URLs',
          inline: true
        }
      )
      .setFooter({
        text: 'Choose your export format below',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const exportButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('export_full')
          .setLabel('Full List')
          .setEmoji('📋')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('export_summary')
          .setLabel('Category Summary')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('export_urls')
          .setLabel('URLs Only')
          .setEmoji('🔗')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.reply({
      embeds: [exportEmbed],
      components: [exportButtons],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      time: 60000 // 1 minute
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This export is not for you!', flags: [MessageFlags.Ephemeral] });
      }

      let exportContent = '';
      switch (i.customId) {
        case 'export_full':
          exportContent = this.formatFullExport(userMemes);
          break;
        case 'export_summary':
          exportContent = this.formatSummaryExport(userMemes);
          break;
        case 'export_urls':
          exportContent = this.formatUrlsExport(userMemes);
          break;
      }

      const exportResultEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('📤 Export Complete')
        .setDescription(`Successfully exported **${userMemes.length}** memes!`)
        .addFields(
          {
            name: '📄 Export Content',
            value: exportContent.length > 1024 ? 
              exportContent.substring(0, 1021) + '...' : 
              exportContent,
            inline: false
          }
        )
        .setFooter({
          text: 'Copy the content above to save your collection',
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      await i.update({
        embeds: [exportResultEmbed],
        components: []
      });
    });
  },

  async clearCollection(interaction) {
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('⚠️ Clear Meme Collection')
      .setDescription('Are you sure you want to clear your entire meme collection?')
      .addFields(
        {
          name: '🗑️ This action will:',
          value: '• Delete all saved memes\n• Remove all categories\n• Reset your collection stats\n• **This cannot be undone!**',
          inline: false
        },
        {
          name: '💡 Alternative',
          value: 'Consider using filters or categories instead of clearing everything.',
          inline: false
        }
      )
      .setFooter({
        text: 'Click "Confirm Clear" to proceed or "Cancel" to keep your collection',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const confirmButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_clear')
          .setLabel('Confirm Clear')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_clear')
          .setLabel('Cancel')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.reply({
      embeds: [confirmEmbed],
      components: [confirmButtons],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      time: 30000 // 30 seconds
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This confirmation is not for you!', flags: [MessageFlags.Ephemeral] });
      }

      if (i.customId === 'confirm_clear') {
        // In a real implementation, this would clear the user's memes from the database
        const clearedEmbed = new EmbedBuilder()
          .setColor(0x4ECDC4)
          .setTitle('🗑️ Collection Cleared')
          .setDescription('Your meme collection has been successfully cleared.')
          .addFields(
            {
              name: '📊 What happened:',
              value: '• All saved memes removed\n• Collection stats reset\n• Categories cleared\n• Fresh start ready!',
              inline: false
            },
            {
              name: '🎯 Next Steps:',
              value: '• Use `/meme` to discover new memes\n• Save your favorites\n• Build a new collection!',
              inline: false
            }
          )
          .setFooter({
            text: 'Your collection has been reset',
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTimestamp();

        await i.update({
          embeds: [clearedEmbed],
          components: []
        });
      } else {
        const cancelledEmbed = new EmbedBuilder()
          .setColor(0x4ECDC4)
          .setTitle('✅ Clear Cancelled')
          .setDescription('Your meme collection has been preserved.')
          .addFields(
            {
              name: '💾 Collection Status:',
              value: '• All memes are safe\n• No changes made\n• Continue enjoying your collection!',
              inline: false
            }
          )
          .setFooter({
            text: 'Your collection remains intact',
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTimestamp();

        await i.update({
          embeds: [cancelledEmbed],
          components: []
        });
      }
    });
  },

  // Helper methods
  async getUserMemes(userId, category = null) {
    // Simulate database query - in real implementation, this would query a database
    const mockMemes = [
      {
        id: 1,
        title: 'Programming Humor',
        url: 'https://example.com/meme1.jpg',
        category: 'programming',
        source: 'Reddit',
        savedAt: new Date(Date.now() - 86400000), // 1 day ago
        rating: 4.5
      },
      {
        id: 2,
        title: 'Cute Dog Meme',
        url: 'https://example.com/meme2.jpg',
        category: 'dogs',
        source: 'Reddit',
        savedAt: new Date(Date.now() - 172800000), // 2 days ago
        rating: 4.8
      },
      {
        id: 3,
        title: 'Gaming Moment',
        url: 'https://example.com/meme3.jpg',
        category: 'gaming',
        source: 'Reddit',
        savedAt: new Date(Date.now() - 259200000), // 3 days ago
        rating: 4.2
      }
    ];

    if (category) {
      return mockMemes.filter(meme => meme.category === category);
    }
    return mockMemes;
  },

  async getUserStats(userId) {
    // Simulate user stats
    return {
      totalMemes: 15,
      categories: 8,
      avgRating: 4.3,
      collectionAge: '2 weeks',
      topCategories: [
        { category: 'programming', count: 5 },
        { category: 'gaming', count: 4 },
        { category: 'dank', count: 3 }
      ],
      thisWeek: 3,
      thisMonth: 8,
      lastSave: '2 hours ago'
    };
  },

  getUniqueCategories(memes) {
    return [...new Set(memes.map(meme => meme.category))];
  },

  getLatestSave(memes) {
    if (memes.length === 0) return 'Never';
    const latest = memes.reduce((latest, meme) => 
      meme.savedAt > latest.savedAt ? meme : latest
    );
    return this.formatTimeAgo(latest.savedAt);
  },

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Less than an hour ago';
  },

  formatTopCategories(categories) {
    return categories.map(cat => 
      `**${cat.category}:** ${cat.count} memes`
    ).join('\n');
  },

  getAchievements(stats) {
    const achievements = [];
    if (stats.totalMemes >= 10) achievements.push('🏆 **Meme Collector** - 10+ memes saved');
    if (stats.categories >= 5) achievements.push('📂 **Category Master** - 5+ categories');
    if (stats.avgRating >= 4.5) achievements.push('⭐ **Quality Curator** - High-rated collection');
    if (stats.thisWeek >= 5) achievements.push('🔥 **Active Collector** - 5+ memes this week');
    
    return achievements.length > 0 ? achievements.join('\n') : 'No achievements unlocked yet!';
  },

  formatFullExport(memes) {
    return memes.map((meme, index) => 
      `${index + 1}. **${meme.title}**\n   Category: ${meme.category}\n   Source: ${meme.source}\n   Rating: ${meme.rating}/5\n   Saved: ${this.formatTimeAgo(meme.savedAt)}\n   URL: ${meme.url}`
    ).join('\n\n');
  },

  formatSummaryExport(memes) {
    const categories = {};
    memes.forEach(meme => {
      if (!categories[meme.category]) categories[meme.category] = [];
      categories[meme.category].push(meme);
    });

    return Object.entries(categories).map(([category, categoryMemes]) => 
      `**${category.toUpperCase()}** (${categoryMemes.length} memes):\n${categoryMemes.map(meme => `• ${meme.title}`).join('\n')}`
    ).join('\n\n');
  },

  formatUrlsExport(memes) {
    return memes.map((meme, index) => 
      `${index + 1}. ${meme.title}: ${meme.url}`
    ).join('\n');
  },

  async updateCollectionView(interaction, memes, page, memesPerPage, category) {
    const startIndex = page * memesPerPage;
    const pageMemes = memes.slice(startIndex, startIndex + memesPerPage);
    
    const embed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📚 Your Meme Collection')
      .setDescription(`Page ${page + 1} of ${Math.ceil(memes.length / memesPerPage)}${category ? ` - Filtered by ${category}` : ''}`)
      .addFields(
        {
          name: '📊 Collection Info',
          value: `**Total Memes:** ${memes.length}\n**Categories:** ${this.getUniqueCategories(memes).length}\n**Latest Save:** ${this.getLatestSave(memes)}`,
          inline: true
        },
        {
          name: '🎯 Quick Actions',
          value: 'Use the buttons below to navigate and manage your collection!',
          inline: true
        }
      );

    if (pageMemes.length > 0) {
      embed.addFields({
        name: '📖 Saved Memes',
        value: pageMemes.map((meme, index) => 
          `${startIndex + index + 1}. **${meme.title}**\n   Category: ${meme.category} | Rating: ${meme.rating}/5\n   Saved: ${this.formatTimeAgo(meme.savedAt)}`
        ).join('\n\n'),
        inline: false
      });
    }

    embed.setFooter({
      text: `Collection of ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true })
    }).setTimestamp();

    await interaction.update({
      embeds: [embed]
    });
  },

  async showCategoryFilter(interaction, response) {
    const categories = ['programming', 'dogs', 'cats', 'gaming', 'dank', 'art', 'music', 'food', 'random'];
    
    const filterEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🔍 Filter by Category')
      .setDescription('Select a category to filter your meme collection:')
      .addFields(
        {
          name: '📂 Available Categories',
          value: categories.map(cat => `• **${cat.charAt(0).toUpperCase() + cat.slice(1)}**`).join('\n'),
          inline: true
        },
        {
          name: '💡 Filter Options',
          value: '• Click a category to filter\n• Select "All" to show everything\n• Use "Clear Filter" to reset',
          inline: true
        }
      )
      .setFooter({
        text: 'Choose a category to filter your collection',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('category_filter')
      .setPlaceholder('Select a category to filter by')
      .addOptions([
        {
          label: 'All Categories',
          description: 'Show all saved memes',
          value: 'all',
          emoji: '🌍'
        },
        ...categories.map(cat => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          description: `Show ${cat} memes only`,
          value: cat,
          emoji: this.getCategoryEmoji(cat)
        }))
      ]);

    const selectRow = new ActionRowBuilder().addComponents(categorySelect);

    await interaction.update({
      embeds: [filterEmbed],
      components: [selectRow]
    });
  },

  getCategoryEmoji(category) {
    const emojis = {
      'programming': '🎭',
      'dogs': '🐕',
      'cats': '🐱',
      'gaming': '🎮',
      'dank': '😂',
      'art': '🎨',
      'music': '🎵',
      'food': '🍕',
      'random': '🌍'
    };
    return emojis[category] || '📂';
  }
}; 