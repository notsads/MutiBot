const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UIUtils = require('../../utils/uiUtils');

const responses = {
  positive: [
    { answer: 'Yes.', confidence: 95, emoji: '✅' },
    { answer: 'Definitely.', confidence: 90, emoji: '✨' },
    { answer: 'Absolutely!', confidence: 85, emoji: '🎉' },
    { answer: "It's certain.", confidence: 80, emoji: '🔮' },
    { answer: 'Yes, in due time.', confidence: 75, emoji: '⏰' },
    { answer: 'Without a doubt.', confidence: 85, emoji: '💫' },
    { answer: 'You can count on it.', confidence: 80, emoji: '🤝' },
    { answer: 'Most likely.', confidence: 70, emoji: '👍' },
    { answer: 'Outlook good.', confidence: 75, emoji: '🌅' },
    { answer: 'Signs point to yes.', confidence: 70, emoji: '📈' }
  ],
  negative: [
    { answer: 'No.', confidence: 95, emoji: '❌' },
    { answer: 'Absolutely not.', confidence: 90, emoji: '🚫' },
    { answer: 'No way!', confidence: 85, emoji: '💥' },
    { answer: "I wouldn't count on it.", confidence: 80, emoji: '🤔' },
    { answer: 'Very doubtful.', confidence: 85, emoji: '😕' },
    { answer: 'My sources say no.', confidence: 80, emoji: '📰' },
    { answer: 'Outlook not so good.', confidence: 75, emoji: '🌧️' },
    { answer: 'Don\'t bet on it.', confidence: 80, emoji: '🎲' },
    { answer: 'My reply is no.', confidence: 85, emoji: '💭' },
    { answer: 'Cannot predict now.', confidence: 70, emoji: '🔮' }
  ],
  neutral: [
    { answer: 'Ask again later.', confidence: 60, emoji: '⏳' },
    { answer: 'Maybe.', confidence: 50, emoji: '🤷' },
    { answer: 'Reply hazy, try again.', confidence: 55, emoji: '🌫️' },
    { answer: 'Better not tell you now.', confidence: 65, emoji: '🤐' },
    { answer: 'Concentrate and ask again.', confidence: 60, emoji: '🧘' },
    { answer: 'The stars are unclear.', confidence: 55, emoji: '⭐' },
    { answer: 'Ask again when the moon is full.', confidence: 50, emoji: '🌕' },
    { answer: 'The answer lies within you.', confidence: 45, emoji: '🧘‍♀️' },
    { answer: 'Time will tell.', confidence: 50, emoji: '⏰' },
    { answer: 'The future is uncertain.', confidence: 55, emoji: '🔮' }
  ]
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the Magic 8 Ball a question.')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your question for the Magic 8 Ball')
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    
    // Show loading state
    const loadingEmbed = UIUtils.createAnimatedEmbed(
      '🔮 Consulting the Magic 8 Ball',
      'Shaking the mystical orb...',
      UIUtils.colors.purple,
      'loading'
    );
    
    await interaction.reply({ embeds: [loadingEmbed] });

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determine response category based on question analysis
    const category = this.analyzeQuestion(question);
    const responsePool = responses[category];
    const response = responsePool[Math.floor(Math.random() * responsePool.length)];

    // Create confidence bar
    const confidenceBar = UIUtils.createProgressBar(response.confidence, 100, 15, false);

    // Determine color based on category
    let color;
    switch (category) {
      case 'positive':
        color = UIUtils.colors.success;
        break;
      case 'negative':
        color = UIUtils.colors.error;
        break;
      case 'neutral':
        color = UIUtils.colors.warning;
        break;
    }

    const embed = UIUtils.createAnimatedEmbed(
      '🔮 Magic 8 Ball',
      `**Your Question:** ${question}`,
      color,
      'info',
      [
        {
          name: `${response.emoji} The Answer`,
          value: `**${response.answer}**`,
          inline: false
        },
        {
          name: '📊 Confidence Level',
          value: `${confidenceBar} **${response.confidence}%**`,
          inline: true
        },
        {
          name: '🎯 Response Type',
          value: this.getCategoryDisplay(category),
          inline: true
        },
        {
          name: '🔮 Mystical Insights',
          value: this.getMysticalInsight(response.confidence, category),
          inline: false
        }
      ],
      {
        text: `Asked by ${interaction.user.tag} • Magic 8 Ball`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      }
    );

    // Create action buttons
    const actionButtons = UIUtils.createActionButtons([
      {
        id: 'ask_again',
        label: 'Ask Again',
        emoji: '🔄',
        style: 'primary'
      },
      {
        id: 'detailed_reading',
        label: 'Detailed Reading',
        emoji: '🔮',
        style: 'secondary'
      },
      {
        id: 'history',
        label: 'History',
        emoji: '📜',
        style: 'secondary'
      }
    ]);

    const messageResponse = await interaction.editReply({ 
      embeds: [embed], 
      components: [actionButtons] 
    });

    // Create collector for interactions
    const filter = (i) => 
      (i.customId === 'ask_again' || 
       i.customId === 'detailed_reading' || 
       i.customId === 'history') && 
      i.user.id === interaction.user.id;

    const collector = messageResponse.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });

    let questionHistory = [{ question, answer: response.answer, confidence: response.confidence, timestamp: Date.now() }];

    collector.on('collect', async (i) => {
      if (i.customId === 'ask_again') {
        // Show loading state
        const refreshLoadingEmbed = UIUtils.createAnimatedEmbed(
          '🔮 Re-consulting the Magic 8 Ball',
          'Shaking the mystical orb again...',
          UIUtils.colors.purple,
          'loading'
        );
        
        await i.update({ embeds: [refreshLoadingEmbed], components: [] });

        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get new response
        const newCategory = this.analyzeQuestion(question);
        const newResponsePool = responses[newCategory];
        const newResponse = newResponsePool[Math.floor(Math.random() * newResponsePool.length)];

        // Add to history
        questionHistory.push({ 
          question, 
          answer: newResponse.answer, 
          confidence: newResponse.confidence, 
          timestamp: Date.now() 
        });

        const newConfidenceBar = UIUtils.createProgressBar(newResponse.confidence, 100, 15, false);

        let newColor;
        switch (newCategory) {
          case 'positive':
            newColor = UIUtils.colors.success;
            break;
          case 'negative':
            newColor = UIUtils.colors.error;
            break;
          case 'neutral':
            newColor = UIUtils.colors.warning;
            break;
        }

        const newEmbed = UIUtils.createAnimatedEmbed(
          '🔮 Magic 8 Ball (Re-consulted)',
          `**Your Question:** ${question}`,
          newColor,
          'info',
          [
            {
              name: `${newResponse.emoji} The Answer`,
              value: `**${newResponse.answer}**`,
              inline: false
            },
            {
              name: '📊 Confidence Level',
              value: `${newConfidenceBar} **${newResponse.confidence}%**`,
              inline: true
            },
            {
              name: '🎯 Response Type',
              value: this.getCategoryDisplay(newCategory),
              inline: true
            },
            {
              name: '🔮 Mystical Insights',
              value: this.getMysticalInsight(newResponse.confidence, newCategory),
              inline: false
            }
          ],
          {
            text: `Re-asked by ${interaction.user.tag} • Magic 8 Ball`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          }
        );

        await i.update({ embeds: [newEmbed], components: [actionButtons] });

      } else if (i.customId === 'detailed_reading') {
        const detailedEmbed = this.createDetailedReadingEmbed(question, response, category, interaction);
        const backButton = UIUtils.createActionButtons([
          {
            id: 'back_to_answer',
            label: 'Back to Answer',
            emoji: '🔙',
            style: 'secondary'
          }
        ]);

        await i.update({ embeds: [detailedEmbed], components: [backButton] });

      } else if (i.customId === 'history') {
        const historyEmbed = this.createHistoryEmbed(questionHistory, interaction);
        const backButton = UIUtils.createActionButtons([
          {
            id: 'back_to_answer',
            label: 'Back to Answer',
            emoji: '🔙',
            style: 'secondary'
          }
        ]);

        await i.update({ embeds: [historyEmbed], components: [backButton] });

      } else if (i.customId === 'back_to_answer') {
        await i.update({ embeds: [embed], components: [actionButtons] });
      }
    });

    collector.on('end', () => {
      // Disable all buttons when collector expires
      const disabledButtons = UIUtils.createActionButtons([
        {
          id: 'ask_again',
          label: 'Ask Again',
          emoji: '🔄',
          style: 'primary',
          disabled: true
        },
        {
          id: 'detailed_reading',
          label: 'Detailed Reading',
          emoji: '🔮',
          style: 'secondary',
          disabled: true
        },
        {
          id: 'history',
          label: 'History',
          emoji: '📜',
          style: 'secondary',
          disabled: true
        }
      ]);
      
      interaction.editReply({
        components: [disabledButtons],
      }).catch(() => {});
    });
  },

  analyzeQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Positive indicators
    const positiveWords = ['will', 'can', 'should', 'good', 'love', 'happy', 'success', 'win', 'yes', 'positive'];
    const negativeWords = ['bad', 'fail', 'lose', 'hate', 'sad', 'no', 'negative', 'wrong', 'terrible', 'awful'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerQuestion.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerQuestion.includes(word)) negativeScore++;
    });
    
    // Determine category based on scores
    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  },

  getCategoryDisplay(category) {
    switch (category) {
      case 'positive':
        return '🟢 Positive';
      case 'negative':
        return '🔴 Negative';
      case 'neutral':
        return '🟡 Neutral';
    }
  },

  getMysticalInsight(confidence, category) {
    if (confidence >= 90) {
      return '🌟 **The stars align perfectly!** This answer carries great cosmic significance.';
    } else if (confidence >= 75) {
      return '✨ **The mystical forces are strong.** Trust in this guidance.';
    } else if (confidence >= 60) {
      return '🔮 **The future is partially clear.** Consider this answer carefully.';
    } else {
      return '🌫️ **The mists of uncertainty cloud the vision.** The answer may change with time.';
    }
  },

  createDetailedReadingEmbed(question, response, category, interaction) {
    const detailedEmbed = UIUtils.createAnimatedEmbed(
      '🔮 Detailed Mystical Reading',
      `**Question:** ${question}`,
      UIUtils.colors.purple,
      'info',
      [
        {
          name: '📖 Primary Answer',
          value: `${response.emoji} **${response.answer}**`,
          inline: false
        },
        {
          name: '🔍 Interpretation',
          value: this.getDetailedInterpretation(response.answer, category),
          inline: false
        },
        {
          name: '⭐ Cosmic Alignment',
          value: this.getCosmicAlignment(response.confidence),
          inline: true
        },
        {
          name: '🌙 Lunar Phase',
          value: this.getLunarPhase(),
          inline: true
        },
        {
          name: '💫 Astrological Influence',
          value: this.getAstrologicalInfluence(),
          inline: true
        },
        {
          name: '🎯 Recommended Action',
          value: this.getRecommendedAction(category, response.confidence),
          inline: false
        }
      ],
      {
        text: `Detailed reading for ${interaction.user.tag} • Magic 8 Ball`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      }
    );

    return detailedEmbed;
  },

  createHistoryEmbed(history, interaction) {
    const historyText = history.map((entry, index) => {
      const timeAgo = UIUtils.createRelativeTimestamp(new Date(entry.timestamp));
      return `**${history.length - index}.** ${entry.answer} (${entry.confidence}%) • ${timeAgo}`;
    }).join('\n');

    const historyEmbed = UIUtils.createAnimatedEmbed(
      '📜 Question History',
      `**Question:** ${history[0].question}`,
      UIUtils.colors.secondary,
      'info',
      [
        {
          name: '🕰️ Previous Answers',
          value: historyText || 'No previous answers',
          inline: false
        },
        {
          name: '📊 Statistics',
          value: this.getHistoryStats(history),
          inline: true
        }
      ],
      {
        text: `History for ${interaction.user.tag} • ${history.length} consultations`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      }
    );

    return historyEmbed;
  },

  getDetailedInterpretation(answer, category) {
    const interpretations = {
      'Yes.': 'The universe strongly affirms your path. Move forward with confidence.',
      'No.': 'The cosmic forces suggest reconsideration. This may not be the right time.',
      'Maybe.': 'The future is balanced on a knife\'s edge. Your choices will determine the outcome.',
      'Ask again later.': 'The stars are not yet aligned. Patience will bring clarity.',
      'Definitely.': 'The mystical forces are unanimous. This is your destined path.',
      'Absolutely not.': 'The cosmic warning is clear. Heed this guidance.',
      'It\'s certain.': 'The prophecy is written in the stars. Success is assured.',
      'Very doubtful.': 'The omens are unfavorable. Consider an alternative approach.'
    };

    return interpretations[answer] || 'The mystical meaning is open to interpretation. Trust your intuition.';
  },

  getCosmicAlignment(confidence) {
    if (confidence >= 90) return '🌟 Perfect Alignment';
    if (confidence >= 75) return '✨ Strong Alignment';
    if (confidence >= 60) return '⭐ Moderate Alignment';
    return '🌙 Weak Alignment';
  },

  getLunarPhase() {
    const phases = ['🌑 New Moon', '🌒 Waxing Crescent', '🌓 First Quarter', '🌔 Waxing Gibbous', '🌕 Full Moon', '🌖 Waning Gibbous', '🌗 Last Quarter', '🌘 Waning Crescent'];
    return phases[Math.floor(Math.random() * phases.length)];
  },

  getAstrologicalInfluence() {
    const influences = ['♈ Aries (Courage)', '♉ Taurus (Stability)', '♊ Gemini (Communication)', '♋ Cancer (Intuition)', '♌ Leo (Leadership)', '♍ Virgo (Precision)', '♎ Libra (Balance)', '♏ Scorpio (Transformation)', '♐ Sagittarius (Adventure)', '♑ Capricorn (Ambition)', '♒ Aquarius (Innovation)', '♓ Pisces (Compassion)'];
    return influences[Math.floor(Math.random() * influences.length)];
  },

  getRecommendedAction(category, confidence) {
    if (category === 'positive' && confidence >= 80) {
      return '🚀 **Take immediate action!** The stars are aligned in your favor.';
    } else if (category === 'positive') {
      return '✅ **Proceed with caution.** The path is favorable but requires care.';
    } else if (category === 'negative' && confidence >= 80) {
      return '⚠️ **Strongly reconsider.** The cosmic warning is clear.';
    } else if (category === 'negative') {
      return '🤔 **Wait and reflect.** Consider alternative approaches.';
    } else {
      return '⏳ **Meditate on this.** The answer will become clear with time.';
    }
  },

  getHistoryStats(history) {
    if (history.length === 0) return 'No data';
    
    const avgConfidence = Math.round(history.reduce((acc, entry) => acc + entry.confidence, 0) / history.length);
    const positiveCount = history.filter(entry => entry.answer.includes('Yes') || entry.answer.includes('Definitely') || entry.answer.includes('Absolutely')).length;
    const negativeCount = history.filter(entry => entry.answer.includes('No') || entry.answer.includes('Not') || entry.answer.includes('Doubtful')).length;
    
    return `**Avg Confidence:** ${avgConfidence}%\n**Positive:** ${positiveCount}\n**Negative:** ${negativeCount}\n**Neutral:** ${history.length - positiveCount - negativeCount}`;
  }
};
