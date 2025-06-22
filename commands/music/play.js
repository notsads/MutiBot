const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatTime } = require('../../utils/utils');
const UIUtils = require('../../utils/uiUtils');

const autocompleteMap = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist from different Sources')

    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name or URL')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('source')
        .setDescription('The source you want to play the music from')
        .addChoices(
          { name: 'Youtube', value: 'ytsearch' },
          { name: 'Youtube Music', value: 'ytmsearch' },
          { name: 'Spotify', value: 'spsearch' },
          { name: 'Soundcloud', value: 'scsearch' },
          { name: 'Deezer', value: 'dzsearch' }
        )
    ),

  async autocomplete(interaction) {
    try {
      const query = interaction.options.getFocused();
      const member = interaction.member;
      if (!member.voice.channel) {
        return await interaction.respond([
          {
            name: '⚠️ Join a voice channel first!',
            value: 'join_vc',
          },
        ]);
      }
      if (!query.trim()) {
        return await interaction.respond([
          {
            name: 'Start typing to search for songs...',
            value: 'start_typing',
          },
        ]);
      }

      const source = 'spsearch';

      player = interaction.client.lavalink.createPlayer({
        guildId: interaction.guildId,
        textChannelId: interaction.channelId,
        voiceChannelId: interaction.member.voice.channel.id,
        selfDeaf: true,
      });

      try {
        const results = await player.search({ query, source });

        if (!results?.tracks?.length) {
          return await interaction.respond([
            { name: 'No results found', value: 'no_results' },
          ]);
        }

        let options = [];

        if (results.loadType === 'playlist') {
          options = [
            {
              name: `📑 Playlist: ${results.playlist?.title || 'Unknown'} (${results.tracks.length} tracks)`,
              value: `${query}`,
            },
          ];
        } else {
          options = results.tracks.slice(0, 25).map((track) => ({
            name: `${track.info.title} - ${track.info.author}`,
            value: track.info.uri,
          }));
        }

        return await interaction.respond(options);
      } catch (searchError) {
        console.error('Search error:', searchError);
        return await interaction.respond([
          { name: 'Error searching for tracks', value: 'error' },
        ]);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      return await interaction.respond([
        { name: 'An error occurred', value: 'error' },
      ]);
    }
  },

  async execute(interaction) {
    const client = interaction.client;
    const query = interaction.options.getString('query');
    const member = interaction.member;
    const source = interaction.options.getString('source') || 'spsearch';

    if (query === 'join_vc' || query === 'start_typing' || query === 'error') {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('Please join a voice channel and select a valid song!'),
        'Invalid Selection',
        [
          'Join a voice channel first',
          'Select a valid song from the autocomplete',
          'Make sure you have the correct permissions'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (query === 'no_results') {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('No results found! Try a different search term.'),
        'No Results',
        [
          'Try using different keywords',
          'Check the spelling of your search',
          'Try searching for a different song'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (!member.voice.channel) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('You need to join a voice channel first!'),
        'Voice Channel Required',
        [
          'Join a voice channel before using this command',
          'Make sure you have permission to join voice channels',
          'Check if the voice channel is available'
        ]
      );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Show loading state
    const loadingEmbed = UIUtils.createAnimatedEmbed(
      '🎵 Searching for Music',
      `Searching for: **${query}**`,
      UIUtils.colors.primary,
      'loading'
    );
    
    await interaction.reply({ embeds: [loadingEmbed] });

    let player = client.lavalink.players.get(interaction.guild.id);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: interaction.guild.id,
        voiceChannelId: member.voice.channel.id,
        textChannelId: interaction.channel.id,
        selfDeaf: true,
      });
    }
    await player.connect();

    let search;
    if (query.startsWith('playlist_')) {
      const actualQuery = query.replace('playlist_', '');
      search = await player.search({ query: actualQuery, source });
    } else {
      const isURL = query.startsWith('http://') || query.startsWith('https://');
      search = await player.search({ query, source });
    }

    if (!search?.tracks?.length) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('No results found! Try a different search term.'),
        'Search Failed',
        [
          'Try using different keywords',
          'Check if the URL is valid',
          'Try searching from a different source'
        ]
      );
      return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (search.loadType === 'playlist') {
      // Show processing state
      const processingEmbed = UIUtils.createAnimatedEmbed(
        '📃 Processing Playlist',
        `Adding ${search.tracks.length} tracks to queue...`,
        UIUtils.colors.info,
        'loading'
      );
      
      await interaction.editReply({ embeds: [processingEmbed] });

      for (const track of search.tracks) {
        track.userData = { requester: interaction.member };
        await player.queue.add(track);
      }

      const totalDuration = search.tracks.reduce((acc, track) => acc + track.info.duration, 0);
      const durationProgress = UIUtils.createProgressBar(totalDuration, 3600000, 15, false); // 1 hour max

      const playlistEmbed = UIUtils.createAnimatedEmbed(
        '📃 Playlist Added to Queue',
        `Successfully added **${search.tracks.length}** tracks from playlist`,
        UIUtils.colors.success,
        'success',
        [
          {
            name: '📋 Playlist Information',
            value: `**Title:** ${search.playlist?.title || 'Unknown'}\n**Author:** ${search.tracks[0].info.author}\n**Source:** ${source}`,
            inline: true
          },
          {
            name: '⏱️ Duration Information',
            value: `**Total Duration:** ${formatTime(totalDuration)}\n**Average Track:** ${formatTime(totalDuration / search.tracks.length)}\n**Duration Bar:** ${durationProgress}`,
            inline: true
          },
          {
            name: '🎵 Track Preview',
            value: `**First:** [${search.tracks[0].info.title}](${search.tracks[0].info.uri})\n**Last:** [${search.tracks[search.tracks.length - 1].info.title}](${search.tracks[search.tracks.length - 1].info.uri})`,
            inline: false
          },
          {
            name: '📊 Queue Statistics',
            value: `**Queue Position:** #${player.queue.tracks.length - search.tracks.length + 1}\n**Total in Queue:** ${player.queue.tracks.length}\n**Estimated Wait:** ${formatTime(player.queue.tracks.reduce((acc, track) => acc + track.info.duration, 0))}`,
            inline: true
          }
        ],
        {
          text: `Added by ${interaction.user.tag} • ${search.tracks.length} tracks`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        },
        search.tracks[0].info.artworkUrl
      );

      if (!player.playing) {
        await player.play();
      }

      // Create action buttons
      const actionButtons = UIUtils.createActionButtons([
        {
          id: 'view_queue',
          label: 'View Queue',
          emoji: '📋',
          style: 'primary'
        },
        {
          id: 'now_playing',
          label: 'Now Playing',
          emoji: '🎵',
          style: 'secondary'
        },
        {
          id: 'playlist_info',
          label: 'Playlist Info',
          emoji: 'ℹ️',
          style: 'secondary'
        }
      ]);

      const response = await interaction.editReply({ embeds: [playlistEmbed], components: [actionButtons] });

      // Create collector for interactions
      const filter = (i) => 
        (i.customId === 'view_queue' || 
         i.customId === 'now_playing' || 
         i.customId === 'playlist_info') && 
        i.user.id === interaction.user.id;

      const collector = response.createMessageComponentCollector({
        filter,
        time: 300000, // 5 minutes
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'view_queue') {
          const queueEmbed = this.createQueueEmbed(player, interaction);
          const backButton = UIUtils.createActionButtons([
            {
              id: 'back_to_playlist',
              label: 'Back to Playlist',
              emoji: '🔙',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [queueEmbed], components: [backButton] });
        } else if (i.customId === 'now_playing') {
          const nowPlayingEmbed = this.createNowPlayingEmbed(player, interaction);
          const backButton = UIUtils.createActionButtons([
            {
              id: 'back_to_playlist',
              label: 'Back to Playlist',
              emoji: '🔙',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [nowPlayingEmbed], components: [backButton] });
        } else if (i.customId === 'playlist_info') {
          const playlistInfoEmbed = this.createPlaylistInfoEmbed(search, interaction);
          const backButton = UIUtils.createActionButtons([
            {
              id: 'back_to_playlist',
              label: 'Back to Playlist',
              emoji: '🔙',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [playlistInfoEmbed], components: [backButton] });
        } else if (i.customId === 'back_to_playlist') {
          await i.update({ embeds: [playlistEmbed], components: [actionButtons] });
        }
      });

      collector.on('end', () => {
        // Disable all buttons when collector expires
        const disabledButtons = UIUtils.createActionButtons([
          {
            id: 'view_queue',
            label: 'View Queue',
            emoji: '📋',
            style: 'primary',
            disabled: true
          },
          {
            id: 'now_playing',
            label: 'Now Playing',
            emoji: '🎵',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'playlist_info',
            label: 'Playlist Info',
            emoji: 'ℹ️',
            style: 'secondary',
            disabled: true
          }
        ]);
        
        interaction.editReply({
          components: [disabledButtons],
        }).catch(() => {});
      });

    } else {
      const track = search.tracks[0];
      track.userData = { requester: interaction.member };

      // Show processing state
      const processingEmbed = UIUtils.createAnimatedEmbed(
        '🎵 Adding Track to Queue',
        `Processing: **${track.info.title}**`,
        UIUtils.colors.info,
        'loading'
      );
      
      await interaction.editReply({ embeds: [processingEmbed] });

      await player.queue.add(track);

      const durationProgress = UIUtils.createProgressBar(track.info.duration, 600000, 15, false); // 10 minutes max

      const trackEmbed = UIUtils.createAnimatedEmbed(
        '🎵 Track Added to Queue',
        `Successfully added **${track.info.title}** to the queue`,
        UIUtils.colors.success,
        'success',
        [
          {
            name: '📋 Track Information',
            value: `**Title:** [${track.info.title}](${track.info.uri})\n**Author:** ${track.info.author}\n**Source:** ${source}`,
            inline: true
          },
          {
            name: '⏱️ Duration Information',
            value: `**Duration:** ${formatTime(track.info.duration)}\n**Queue Position:** #${player.queue.tracks.length}\n**Duration Bar:** ${durationProgress}`,
            inline: true
          },
          {
            name: '👤 Request Information',
            value: `**Requested by:** ${interaction.user.tag}\n**Voice Channel:** ${member.voice.channel.name}\n**Added at:** ${UIUtils.createTimestamp(new Date())}`,
            inline: false
          }
        ],
        {
          text: `Added by ${interaction.user.tag} • Queue position: #${player.queue.tracks.length}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        },
        track.info.artworkUrl
      );

      if (!player.playing) {
        await player.play();
      }

      // Create action buttons
      const actionButtons = UIUtils.createActionButtons([
        {
          id: 'view_queue',
          label: 'View Queue',
          emoji: '📋',
          style: 'primary'
        },
        {
          id: 'now_playing',
          label: 'Now Playing',
          emoji: '🎵',
          style: 'secondary'
        },
        {
          id: 'track_info',
          label: 'Track Info',
          emoji: 'ℹ️',
          style: 'secondary'
        }
      ]);

      const response = await interaction.editReply({ embeds: [trackEmbed], components: [actionButtons] });

      // Create collector for interactions
      const filter = (i) => 
        (i.customId === 'view_queue' || 
         i.customId === 'now_playing' || 
         i.customId === 'track_info') && 
        i.user.id === interaction.user.id;

      const collector = response.createMessageComponentCollector({
        filter,
        time: 300000, // 5 minutes
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'view_queue') {
          const queueEmbed = this.createQueueEmbed(player, interaction);
          const backButton = UIUtils.createActionButtons([
            {
              id: 'back_to_track',
              label: 'Back to Track',
              emoji: '🔙',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [queueEmbed], components: [backButton] });
        } else if (i.customId === 'now_playing') {
          const nowPlayingEmbed = this.createNowPlayingEmbed(player, interaction);
          const backButton = UIUtils.createActionButtons([
            {
              id: 'back_to_track',
              label: 'Back to Track',
              emoji: '🔙',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [nowPlayingEmbed], components: [backButton] });
        } else if (i.customId === 'track_info') {
          const trackInfoEmbed = this.createTrackInfoEmbed(track, interaction);
          const backButton = UIUtils.createActionButtons([
            {
              id: 'back_to_track',
              label: 'Back to Track',
              emoji: '🔙',
              style: 'secondary'
            }
          ]);

          await i.update({ embeds: [trackInfoEmbed], components: [backButton] });
        } else if (i.customId === 'back_to_track') {
          await i.update({ embeds: [trackEmbed], components: [actionButtons] });
        }
      });

      collector.on('end', () => {
        // Disable all buttons when collector expires
        const disabledButtons = UIUtils.createActionButtons([
          {
            id: 'view_queue',
            label: 'View Queue',
            emoji: '📋',
            style: 'primary',
            disabled: true
          },
          {
            id: 'now_playing',
            label: 'Now Playing',
            emoji: '🎵',
            style: 'secondary',
            disabled: true
          },
          {
            id: 'track_info',
            label: 'Track Info',
            emoji: 'ℹ️',
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

  createQueueEmbed(player, interaction) {
    const queue = player.queue.tracks;
    const currentTrack = player.current;
    
    if (!queue.length && !currentTrack) {
      return UIUtils.createInfoEmbed(
        '📋 Music Queue',
        'The queue is empty.',
        [],
        {
          text: `${interaction.guild.name} • Music Queue`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        }
      );
    }

    const queueList = queue.slice(0, 10).map((track, index) => 
      `**${index + 1}.** [${track.info.title}](${track.info.uri}) - ${track.info.author} (${formatTime(track.info.duration)})`
    ).join('\n');

    const totalDuration = queue.reduce((acc, track) => acc + track.info.duration, 0);
    const durationProgress = UIUtils.createProgressBar(totalDuration, 3600000, 15, false);

    return UIUtils.createAnimatedEmbed(
      '📋 Music Queue',
      `**Now Playing:** ${currentTrack ? `[${currentTrack.info.title}](${currentTrack.info.uri})` : 'Nothing'}`,
      UIUtils.colors.primary,
      'info',
      [
        {
          name: '🎵 Up Next',
          value: queueList || 'No tracks in queue',
          inline: false
        },
        {
          name: '📊 Queue Statistics',
          value: `**Total Tracks:** ${queue.length}\n**Total Duration:** ${formatTime(totalDuration)}\n**Duration Bar:** ${durationProgress}`,
          inline: true
        }
      ],
      {
        text: `${interaction.guild.name} • ${queue.length} tracks in queue`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      }
    );
  },

  createNowPlayingEmbed(player, interaction) {
    const currentTrack = player.current;
    
    if (!currentTrack) {
      return UIUtils.createInfoEmbed(
        '🎵 Now Playing',
        'No track is currently playing.',
        [],
        {
          text: `${interaction.guild.name} • Now Playing`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        }
      );
    }

    const progress = player.position / currentTrack.info.duration;
    const progressBar = UIUtils.createProgressBar(player.position, currentTrack.info.duration, 20, false);

    return UIUtils.createAnimatedEmbed(
      '🎵 Now Playing',
      `**${currentTrack.info.title}**`,
      UIUtils.colors.success,
      'info',
      [
        {
          name: '📋 Track Information',
          value: `**Title:** [${currentTrack.info.title}](${currentTrack.info.uri})\n**Author:** ${currentTrack.info.author}\n**Duration:** ${formatTime(currentTrack.info.duration)}`,
          inline: true
        },
        {
          name: '⏱️ Progress Information',
          value: `**Current:** ${formatTime(player.position)}\n**Remaining:** ${formatTime(currentTrack.info.duration - player.position)}\n**Progress:** ${(progress * 100).toFixed(1)}%`,
          inline: true
        },
        {
          name: '📈 Progress Bar',
          value: progressBar,
          inline: false
        }
      ],
      {
        text: `${interaction.guild.name} • Now Playing`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      },
      currentTrack.info.artworkUrl
    );
  },

  createPlaylistInfoEmbed(search, interaction) {
    const totalDuration = search.tracks.reduce((acc, track) => acc + track.info.duration, 0);
    const avgDuration = totalDuration / search.tracks.length;

    return UIUtils.createAnimatedEmbed(
      '📃 Playlist Information',
      `**${search.playlist?.title || 'Unknown Playlist'}**`,
      UIUtils.colors.info,
      'info',
      [
        {
          name: '📊 Playlist Statistics',
          value: `**Total Tracks:** ${search.tracks.length}\n**Total Duration:** ${formatTime(totalDuration)}\n**Average Track:** ${formatTime(avgDuration)}`,
          inline: true
        },
        {
          name: '👤 Playlist Details',
          value: `**Author:** ${search.tracks[0].info.author}\n**Source:** ${search.source || 'Unknown'}\n**Added by:** ${interaction.user.tag}`,
          inline: true
        }
      ],
      {
        text: `Playlist Information • ${search.tracks.length} tracks`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      },
      search.tracks[0].info.artworkUrl
    );
  },

  createTrackInfoEmbed(track, interaction) {
    return UIUtils.createAnimatedEmbed(
      'ℹ️ Track Information',
      `**${track.info.title}**`,
      UIUtils.colors.info,
      'info',
      [
        {
          name: '📋 Track Details',
          value: `**Title:** [${track.info.title}](${track.info.uri})\n**Author:** ${track.info.author}\n**Duration:** ${formatTime(track.info.duration)}`,
          inline: true
        },
        {
          name: '👤 Request Information',
          value: `**Requested by:** ${track.userData.requester.user.tag}\n**Added at:** ${UIUtils.createTimestamp(new Date())}\n**Source:** ${track.source || 'Unknown'}`,
          inline: true
        }
      ],
      {
        text: `Track Information • ${interaction.guild.name}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      },
      track.info.artworkUrl
    );
  }
};
