const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memesearch')
    .setDescription('Search for specific memes with advanced filtering and discovery features.')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search term or meme name')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Filter by meme category')
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
    .addStringOption(option =>
      option.setName('sort')
        .setDescription('Sort results by')
        .setRequired(false)
        .addChoices(
          { name: '🔥 Trending', value: 'trending' },
          { name: '⭐ Top Rated', value: 'rating' },
          { name: '🕒 Newest', value: 'newest' },
          { name: '📊 Most Popular', value: 'popular' }
        )
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const category = interaction.options.getString('category');
    const sort = interaction.options.getString('sort') || 'trending';

    if (!query && !category) {
      return this.showSearchMenu(interaction);
    }

    await interaction.deferReply();

    try {
      // Simulate meme search results
      const searchResults = await this.searchMemes(query, category, sort);
      
      if (searchResults.length === 0) {
        const noResultsEmbed = new EmbedBuilder()
          .setColor(0x4ECDC4)
          .setTitle('🔍 Meme Search Results')
          .setDescription('No memes found matching your criteria.')
          .addFields(
            {
              name: '💡 Search Tips',
              value: '• Try different keywords\n• Use broader categories\n• Check spelling\n• Try popular meme names',
              inline: false
            },
            {
              name: '🎯 Alternative Actions',
              value: '• Browse random memes with `/meme`\n• Create custom memes with `/memegenerator`\n• View trending memes',
              inline: false
            }
          )
          .setFooter({
            text: 'Try a different search term or category',
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTimestamp();

        return interaction.editReply({
          embeds: [noResultsEmbed],
          ephemeral: true
        });
      }

      // Create search results embed
      const searchEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('🔍 Meme Search Results')
        .setDescription(`Found **${searchResults.length}** memes${query ? ` for "${query}"` : ''}${category ? ` in ${category}` : ''}`)
        .addFields(
          {
            name: '📊 Search Info',
            value: `**Query:** ${query || 'All memes'}\n**Category:** ${category || 'All categories'}\n**Sort:** ${this.getSortName(sort)}\n**Results:** ${searchResults.length}`,
            inline: true
          },
          {
            name: '🎯 Quick Actions',
            value: 'Use the buttons below to navigate and interact with results!',
            inline: true
          }
        )
        .setFooter({
          text: `Search by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      // Create navigation buttons
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_result')
            .setLabel('Previous')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('next_result')
            .setLabel('Next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('save_current')
            .setLabel('Save Meme')
            .setEmoji('💾')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('share_current')
            .setLabel('Share')
            .setEmoji('📤')
            .setStyle(ButtonStyle.Secondary)
        );

      const response = await interaction.editReply({
        embeds: [searchEmbed],
        components: [buttons]
      });

      // Create collector for navigation
      const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes
      });

      let currentIndex = 0;

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ This search is not for you!', ephemeral: true });
        }

        switch (i.customId) {
          case 'prev_result':
            currentIndex = Math.max(0, currentIndex - 1);
            await this.updateSearchView(i, searchResults, currentIndex, query, category, sort);
            break;
          case 'next_result':
            currentIndex = Math.min(searchResults.length - 1, currentIndex + 1);
            await this.updateSearchView(i, searchResults, currentIndex, query, category, sort);
            break;
          case 'save_current':
            await this.saveMeme(i, searchResults[currentIndex]);
            break;
          case 'share_current':
            await this.shareMeme(i, searchResults[currentIndex]);
            break;
        }
      });

      collector.on('end', async () => {
        const disabledButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev_result')
              .setLabel('Previous')
              .setEmoji('⬅️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next_result')
              .setLabel('Next')
              .setEmoji('➡️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('save_current')
              .setLabel('Save Meme')
              .setEmoji('💾')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('share_current')
              .setLabel('Share')
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

    } catch (error) {
      console.error('Error in meme search:', error);
      await interaction.editReply({
        content: '❌ An error occurred while searching for memes. Please try again!',
        ephemeral: true
      });
    }
  },

  async showSearchMenu(interaction) {
    const searchMenuEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🔍 Meme Search & Discovery')
      .setDescription('Search for specific memes or discover new ones with advanced filters!')
      .addFields(
        {
          name: '🔎 Search Options',
          value: '• **Text Search** - Find memes by keywords\n• **Category Filter** - Browse by theme\n• **Sort Options** - Trending, Top Rated, Newest\n• **Advanced Filters** - Multiple criteria',
          inline: false
        },
        {
          name: '🎯 Popular Searches',
          value: '• "drake"\n• "distracted boyfriend"\n• "two buttons"\n• "change my mind"\n• "programming"\n• "gaming"',
          inline: true
        },
        {
          name: '📊 Trending Categories',
          value: '• 🎭 Programming\n• 🎮 Gaming\n• 😂 Dank\n• 🐕 Dogs\n• 🐱 Cats\n• 🎨 Art',
          inline: true
        }
      )
      .setFooter({
        text: 'Use the search options below or try a specific query!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const searchButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('search_trending')
          .setLabel('Trending')
          .setEmoji('🔥')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('search_popular')
          .setLabel('Popular')
          .setEmoji('⭐')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('search_newest')
          .setLabel('Newest')
          .setEmoji('🆕')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('search_random')
          .setLabel('Random')
          .setEmoji('🎲')
          .setStyle(ButtonStyle.Secondary)
      );

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('search_category')
      .setPlaceholder('Select a category to browse')
      .addOptions([
        {
          label: 'Programming Memes',
          description: 'Tech jokes, coding humor, developer memes',
          value: 'programming',
          emoji: '🎭'
        },
        {
          label: 'Gaming Memes',
          description: 'Video game humor, esports memes',
          value: 'gaming',
          emoji: '🎮'
        },
        {
          label: 'Dank Memes',
          description: 'Internet humor, viral content',
          value: 'dank',
          emoji: '😂'
        },
        {
          label: 'Animal Memes',
          description: 'Dogs, cats, and other cute animals',
          value: 'animals',
          emoji: '🐕'
        },
        {
          label: 'Art & Music',
          description: 'Creative memes, music humor',
          value: 'creative',
          emoji: '🎨'
        }
      ]);

    const selectRow = new ActionRowBuilder().addComponents(categorySelect);

    const response = await interaction.reply({
      embeds: [searchMenuEmbed],
      components: [searchButtons, selectRow],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This search menu is not for you!', ephemeral: true });
      }

      let searchQuery = '';
      let searchCategory = '';
      let searchSort = 'trending';

      switch (i.customId) {
        case 'search_trending':
          searchQuery = 'trending';
          searchSort = 'trending';
          break;
        case 'search_popular':
          searchQuery = 'popular';
          searchSort = 'popular';
          break;
        case 'search_newest':
          searchQuery = 'newest';
          searchSort = 'newest';
          break;
        case 'search_random':
          searchQuery = 'random';
          searchSort = 'random';
          break;
        case 'search_category':
          searchCategory = i.values[0];
          searchQuery = searchCategory;
          break;
      }

      // Simulate search results
      const searchResults = await this.searchMemes(searchQuery, searchCategory, searchSort);
      
      if (searchResults.length === 0) {
        await i.reply({
          content: '❌ No memes found for this search. Try a different option!',
          ephemeral: true
        });
        return;
      }

      // Create search results embed
      const searchEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle('🔍 Search Results')
        .setDescription(`Found **${searchResults.length}** memes for "${searchQuery}"`)
        .addFields(
          {
            name: '📊 Search Info',
            value: `**Query:** ${searchQuery}\n**Category:** ${searchCategory || 'All'}\n**Sort:** ${this.getSortName(searchSort)}\n**Results:** ${searchResults.length}`,
            inline: true
          },
          {
            name: '🎯 Quick Actions',
            value: 'Use the buttons below to navigate and interact with results!',
            inline: true
          }
        )
        .setFooter({
          text: `Search by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_result')
            .setLabel('Previous')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('next_result')
            .setLabel('Next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('save_current')
            .setLabel('Save Meme')
            .setEmoji('💾')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('share_current')
            .setLabel('Share')
            .setEmoji('📤')
            .setStyle(ButtonStyle.Secondary)
        );

      await i.update({
        embeds: [searchEmbed],
        components: [buttons]
      });

      // Create collector for result navigation
      const resultCollector = response.createMessageComponentCollector({
        time: 300000
      });

      let currentIndex = 0;

      resultCollector.on('collect', async (resultInteraction) => {
        if (resultInteraction.user.id !== interaction.user.id) {
          return resultInteraction.reply({ content: '❌ This search is not for you!', ephemeral: true });
        }

        switch (resultInteraction.customId) {
          case 'prev_result':
            currentIndex = Math.max(0, currentIndex - 1);
            await this.updateSearchView(resultInteraction, searchResults, currentIndex, searchQuery, searchCategory, searchSort);
            break;
          case 'next_result':
            currentIndex = Math.min(searchResults.length - 1, currentIndex + 1);
            await this.updateSearchView(resultInteraction, searchResults, currentIndex, searchQuery, searchCategory, searchSort);
            break;
          case 'save_current':
            await this.saveMeme(resultInteraction, searchResults[currentIndex]);
            break;
          case 'share_current':
            await this.shareMeme(resultInteraction, searchResults[currentIndex]);
            break;
        }
      });
    });
  },

  async searchMemes(query, category, sort) {
    // Simulate meme search results
    const mockResults = [
      {
        id: 1,
        title: 'Programming Humor - Debug Life',
        url: 'https://example.com/meme1.jpg',
        category: 'programming',
        source: 'Reddit',
        rating: 4.8,
        views: 15000,
        createdAt: new Date(Date.now() - 86400000),
        tags: ['programming', 'debug', 'coding', 'humor']
      },
      {
        id: 2,
        title: 'Gaming Moment - Controller Rage',
        url: 'https://example.com/meme2.jpg',
        category: 'gaming',
        source: 'Reddit',
        rating: 4.5,
        views: 12000,
        createdAt: new Date(Date.now() - 172800000),
        tags: ['gaming', 'controller', 'rage', 'funny']
      },
      {
        id: 3,
        title: 'Dank Meme - Internet Culture',
        url: 'https://example.com/meme3.jpg',
        category: 'dank',
        source: 'Reddit',
        rating: 4.2,
        views: 8000,
        createdAt: new Date(Date.now() - 259200000),
        tags: ['dank', 'internet', 'culture', 'viral']
      }
    ];

    // Filter by query if provided
    let filtered = mockResults;
    if (query && query !== 'trending' && query !== 'popular' && query !== 'newest' && query !== 'random') {
      filtered = mockResults.filter(meme => 
        meme.title.toLowerCase().includes(query.toLowerCase()) ||
        meme.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Filter by category if provided
    if (category) {
      filtered = filtered.filter(meme => meme.category === category);
    }

    // Sort results
    switch (sort) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'trending':
      default:
        // Simulate trending algorithm (rating + recent activity)
        filtered.sort((a, b) => (b.rating * 0.7 + (Date.now() - b.createdAt) / 86400000 * 0.3) - 
                                   (a.rating * 0.7 + (Date.now() - a.createdAt) / 86400000 * 0.3));
        break;
    }

    return filtered;
  },

  getSortName(sort) {
    const names = {
      'trending': '🔥 Trending',
      'rating': '⭐ Top Rated',
      'newest': '🕒 Newest',
      'popular': '📊 Most Popular'
    };
    return names[sort] || '🔥 Trending';
  },

  async updateSearchView(interaction, results, index, query, category, sort) {
    const meme = results[index];
    
    const embed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`🔍 ${meme.title}`)
      .setDescription(`**Category:** ${meme.category} | **Source:** ${meme.source}`)
      .setImage(meme.url)
      .addFields(
        {
          name: '📊 Meme Stats',
          value: `**Rating:** ${meme.rating}/5 ⭐\n**Views:** ${meme.views.toLocaleString()}\n**Created:** ${this.formatTimeAgo(meme.createdAt)}`,
          inline: true
        },
        {
          name: '🏷️ Tags',
          value: meme.tags.map(tag => `\`${tag}\``).join(' '),
          inline: true
        },
        {
          name: '📄 Result Info',
          value: `**${index + 1}** of **${results.length}** results\n**Query:** ${query || 'All memes'}\n**Sort:** ${this.getSortName(sort)}`,
          inline: true
        }
      )
      .setFooter({
        text: `Search by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.update({
      embeds: [embed]
    });
  },

  async saveMeme(interaction, meme) {
    // In a real implementation, this would save to the user's collection
    await interaction.reply({
      content: `💾 **Meme Saved!** "${meme.title}" has been added to your collection.`,
      ephemeral: true
    });
  },

  async shareMeme(interaction, meme) {
    const shareEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📤 Share Meme')
      .setDescription(`**${meme.title}**`)
      .setImage(meme.url)
      .addFields(
        {
          name: '📋 Share Options',
          value: '• Copy the URL below\n• Share in another channel\n• Send to a friend\n• Post on social media',
          inline: false
        },
        {
          name: '🔗 Meme URL',
          value: meme.url,
          inline: false
        }
      )
      .setFooter({
        text: `Shared by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [shareEmbed],
      ephemeral: true
    });
  },

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Less than an hour ago';
  }
}; 