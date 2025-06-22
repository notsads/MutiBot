const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ComponentType,
  MessageFlags
} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get random memes from various sources with advanced features.')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose a meme category')
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
    .addBooleanOption(option =>
      option.setName('nsfw')
        .setDescription('(true/false) Include NSFW memes (18+)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const category = interaction.options.getString('category') || 'random';
    const nsfw = interaction.options.getBoolean('nsfw') || false;

    // Check NSFW channel requirement
    if (nsfw && !interaction.channel.nsfw) {
      return interaction.editReply({
        content: '❌ NSFW memes can only be requested in NSFW channels!',
        flags: [MessageFlags.Ephemeral]
      });
    }

    try {
      // Get meme data
      const memeData = await this.getMeme(category, nsfw);
      
      if (!memeData) {
        return interaction.editReply({
          content: '❌ Failed to fetch meme. Please try again!',
          flags: [MessageFlags.Ephemeral]
        });
      }

      // Create meme embed
      const memeEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle(`🎭 ${category.charAt(0).toUpperCase() + category.slice(1)} Meme`)
        .setDescription(memeData.title || 'Random Meme')
        .setImage(memeData.url)
        .addFields(
          {
            name: '📊 Meme Info',
            value: `**Category:** ${category}\n**Source:** ${memeData.source}\n**Rating:** ${memeData.rating || 'N/A'}`,
            inline: true
          },
          {
            name: '🎯 Quick Actions',
            value: 'Use the buttons below to get more memes or change categories!',
            inline: true
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag} • Powered by ${memeData.source}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      // Create action buttons
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('new_meme')
            .setLabel('New Meme')
            .setEmoji('🎲')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('change_category')
            .setLabel('Change Category')
            .setEmoji('📂')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('save_meme')
            .setLabel('Save Meme')
            .setEmoji('💾')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('share_meme')
            .setLabel('Share')
            .setEmoji('📤')
            .setStyle(ButtonStyle.Secondary)
        );

      // Add NSFW toggle if applicable
      if (interaction.channel.nsfw) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_nsfw')
            .setLabel(nsfw ? 'SFW Mode' : 'NSFW Mode')
            .setEmoji(nsfw ? '🔞' : '😇')
            .setStyle(nsfw ? ButtonStyle.Danger : ButtonStyle.Secondary)
        );
      }

      // Send initial response
      const response = await interaction.editReply({
        embeds: [memeEmbed],
        components: [buttons]
      });

      // Create collector for button interactions
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      let currentCategory = category;
      let currentNsfw = nsfw;

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ This meme menu is not for you!', flags: [MessageFlags.Ephemeral] });
        }

        switch (i.customId) {
          case 'new_meme':
            await this.handleNewMeme(i, currentCategory, currentNsfw, response);
            break;
          case 'change_category':
            await this.handleCategoryChange(i, currentNsfw, response);
            break;
          case 'save_meme':
            await i.reply({ 
              content: '💾 **Meme Saved!** (This feature would save the meme to your favorites in a real implementation)', 
              flags: [MessageFlags.Ephemeral]
            });
            break;
          case 'share_meme':
            await i.reply({ 
              content: '📤 **Meme Shared!** (This feature would share the meme to other channels in a real implementation)', 
              flags: [MessageFlags.Ephemeral]
            });
            break;
          case 'toggle_nsfw':
            currentNsfw = !currentNsfw;
            await this.handleNewMeme(i, currentCategory, currentNsfw, response);
            break;
        }
      });

      collector.on('end', async () => {
        const disabledButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('new_meme')
              .setLabel('New Meme')
              .setEmoji('🎲')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('change_category')
              .setLabel('Change Category')
              .setEmoji('📂')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('save_meme')
              .setLabel('Save Meme')
              .setEmoji('💾')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('share_meme')
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
      console.error('Error in meme command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while fetching the meme. Please try again!',
        flags: [MessageFlags.Ephemeral]
      });
    }
  },

  async getMeme(category, nsfw = false) {
    try {
      // Use working meme APIs
      const apis = [
        {
          name: 'Giphy',
          url: `https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${this.getGiphyTag(category)}&rating=${nsfw ? 'r' : 'g'}`,
          parser: this.parseGiphyResponse
        },
        {
          name: 'Tenor',
          url: `https://tenor.googleapis.com/v2/search?q=${this.getTenorQuery(category)}&key=AIzaSyCyouE1IrTz8jW9DhvkAEXqaVSxqjJfJgY&limit=1&media_filter=gif&contentfilter=${nsfw ? 'off' : 'medium'}`,
          parser: this.parseTenorResponse
        },
        {
          name: 'Imgflip',
          url: 'https://api.imgflip.com/get_memes',
          parser: this.parseImgflipResponse
        }
      ];

      // Try each API until one works
      for (const api of apis) {
        try {
          const response = await fetch(api.url);
          if (!response.ok) continue;

          const data = await response.json();
          const memeData = api.parser(data, category);
          
          if (memeData && memeData.url) {
            return {
              ...memeData,
              source: api.name
            };
          }
        } catch (error) {
          console.error(`Error with ${api.name} API:`, error);
          continue;
        }
      }

      // Fallback to static memes if all APIs fail
      return this.getFallbackMeme(category);

    } catch (error) {
      console.error('Error fetching meme:', error);
      return this.getFallbackMeme(category);
    }
  },

  getGiphyTag(category) {
    const tags = {
      'programming': 'programming+humor+coding',
      'dogs': 'funny+dogs+puppy',
      'cats': 'funny+cats+kitten',
      'gaming': 'gaming+video+games',
      'dank': 'dank+meme+funny',
      'art': 'art+creative+funny',
      'music': 'music+funny+song',
      'food': 'food+funny+cooking',
      'random': 'funny+meme+random'
    };
    return tags[category] || 'funny+meme';
  },

  getTenorQuery(category) {
    const queries = {
      'programming': 'programming meme',
      'dogs': 'funny dogs',
      'cats': 'funny cats',
      'gaming': 'gaming meme',
      'dank': 'dank meme',
      'art': 'art meme',
      'music': 'music meme',
      'food': 'food meme',
      'random': 'funny meme'
    };
    return queries[category] || 'funny meme';
  },

  parseGiphyResponse(data, category) {
    if (data.data && data.data.images && data.data.images.original) {
      return {
        title: data.data.title || `${category} meme`,
        url: data.data.images.original.url,
        rating: 4.5,
        author: 'Giphy',
        nsfw: false
      };
    }
    return null;
  },

  parseTenorResponse(data, category) {
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        title: result.title || `${category} meme`,
        url: result.media_formats?.gif?.url || result.media_formats?.mp4?.url,
        rating: 4.3,
        author: 'Tenor',
        nsfw: false
      };
    }
    return null;
  },

  parseImgflipResponse(data, category) {
    if (data.success && data.data && data.data.memes && data.data.memes.length > 0) {
      const memes = data.data.memes;
      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      return {
        title: randomMeme.name || `${category} meme`,
        url: randomMeme.url,
        rating: 4.0,
        author: 'Imgflip',
        nsfw: false
      };
    }
    return null;
  },

  getFallbackMeme(category) {
    // Fallback memes with working image URLs
    const fallbackMemes = {
      'programming': {
        title: 'Programming Humor',
        url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
        rating: 4.5,
        author: 'Fallback',
        nsfw: false
      },
      'dogs': {
        title: 'Funny Dog',
        url: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif',
        rating: 4.8,
        author: 'Fallback',
        nsfw: false
      },
      'cats': {
        title: 'Funny Cat',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        rating: 4.7,
        author: 'Fallback',
        nsfw: false
      },
      'gaming': {
        title: 'Gaming Moment',
        url: 'https://media.giphy.com/media/3o7abGhdmKDhKALHDK/giphy.gif',
        rating: 4.4,
        author: 'Fallback',
        nsfw: false
      },
      'dank': {
        title: 'Dank Meme',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        rating: 4.6,
        author: 'Fallback',
        nsfw: false
      },
      'art': {
        title: 'Art Meme',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        rating: 4.3,
        author: 'Fallback',
        nsfw: false
      },
      'music': {
        title: 'Music Meme',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        rating: 4.2,
        author: 'Fallback',
        nsfw: false
      },
      'food': {
        title: 'Food Meme',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        rating: 4.1,
        author: 'Fallback',
        nsfw: false
      },
      'random': {
        title: 'Random Meme',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        rating: 4.0,
        author: 'Fallback',
        nsfw: false
      }
    };

    return fallbackMemes[category] || fallbackMemes['random'];
  },

  async handleNewMeme(interaction, category, nsfw, response) {
    try {
      const memeData = await this.getMeme(category, nsfw);
      
      const memeEmbed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle(`🎭 ${category.charAt(0).toUpperCase() + category.slice(1)} Meme`)
        .setDescription(memeData.title || 'Random Meme')
        .setImage(memeData.url)
        .addFields(
          {
            name: '📊 Meme Info',
            value: `**Category:** ${category}\n**Source:** ${memeData.source}\n**Rating:** ${memeData.rating || 'N/A'}`,
            inline: true
          },
          {
            name: '🎯 Quick Actions',
            value: 'Use the buttons below to get more memes or change categories!',
            inline: true
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag} • Powered by ${memeData.source}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      await interaction.update({
        embeds: [memeEmbed]
      });

    } catch (error) {
      console.error('Error handling new meme:', error);
      await interaction.reply({
        content: '❌ Failed to fetch new meme. Please try again!',
        flags: [MessageFlags.Ephemeral]
      });
    }
  },

  async handleCategoryChange(interaction, nsfw, response) {
    const categories = [
      { label: '🎭 Programming', value: 'programming' },
      { label: '🐕 Dogs', value: 'dogs' },
      { label: '🐱 Cats', value: 'cats' },
      { label: '🎮 Gaming', value: 'gaming' },
      { label: '😂 Dank', value: 'dank' },
      { label: '🎨 Art', value: 'art' },
      { label: '🎵 Music', value: 'music' },
      { label: '🍕 Food', value: 'food' },
      { label: '🌍 Random', value: 'random' }
    ];

    const categoryButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('cat_programming')
          .setLabel('Programming')
          .setEmoji('🎭')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_dogs')
          .setLabel('Dogs')
          .setEmoji('🐕')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_cats')
          .setLabel('Cats')
          .setEmoji('🐱')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_gaming')
          .setLabel('Gaming')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Secondary)
      );

    const categoryButtons2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('cat_dank')
          .setLabel('Dank')
          .setEmoji('😂')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_art')
          .setLabel('Art')
          .setEmoji('🎨')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_music')
          .setLabel('Music')
          .setEmoji('🎵')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_food')
          .setLabel('Food')
          .setEmoji('🍕')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cat_random')
          .setLabel('Random')
          .setEmoji('🌍')
          .setStyle(ButtonStyle.Secondary)
      );

    const categoryEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('📂 Choose Meme Category')
      .setDescription('Select a category to get memes from that specific theme!')
      .addFields(
        {
          name: '🎭 Programming',
          value: 'Tech jokes, coding memes, developer humor',
          inline: true
        },
        {
          name: '🐕 Dogs',
          value: 'Cute dogs, funny dog moments, pet humor',
          inline: true
        },
        {
          name: '🐱 Cats',
          value: 'Cat memes, feline humor, kitty content',
          inline: true
        },
        {
          name: '🎮 Gaming',
          value: 'Video game memes, gaming culture, esports humor',
          inline: true
        },
        {
          name: '😂 Dank',
          value: 'Internet humor, viral memes, trending content',
          inline: true
        },
        {
          name: '🎨 Art',
          value: 'Artistic memes, creative humor, design jokes',
          inline: true
        }
      )
      .setFooter({
        text: 'Click a category button to start browsing!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.update({
      embeds: [categoryEmbed],
      components: [categoryButtons, categoryButtons2]
    });

    // Create collector for category selection
    const categoryCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 // 1 minute
    });

    categoryCollector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This menu is not for you!', flags: [MessageFlags.Ephemeral] });
      }

      if (i.customId.startsWith('cat_')) {
        const selectedCategory = i.customId.replace('cat_', '');
        await this.handleNewMeme(i, selectedCategory, nsfw, response);
        categoryCollector.stop();
      }
    });

    categoryCollector.on('end', async () => {
      // Restore original buttons
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('new_meme')
            .setLabel('New Meme')
            .setEmoji('🎲')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('change_category')
            .setLabel('Change Category')
            .setEmoji('📂')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('save_meme')
            .setLabel('Save Meme')
            .setEmoji('💾')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('share_meme')
            .setLabel('Share')
            .setEmoji('📤')
            .setStyle(ButtonStyle.Secondary)
        );

      if (interaction.channel.nsfw) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_nsfw')
            .setLabel(nsfw ? 'SFW Mode' : 'NSFW Mode')
            .setEmoji(nsfw ? '🔞' : '😇')
            .setStyle(nsfw ? ButtonStyle.Danger : ButtonStyle.Secondary)
        );
      }

      try {
        await response.edit({
          components: [buttons]
        });
      } catch (error) {
        console.error('Error restoring buttons:', error);
      }
    });
  }
};
