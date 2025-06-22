const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const { translate } = require('@vitalets/google-translate-api');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text between multiple languages with advanced features.')
    .addStringOption((option) =>
      option
        .setName('text')
        .setDescription('The text to translate')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('target')
        .setDescription('The language to translate to')
        .setRequired(false)
        .addChoices(
          { name: '🇪🇸 Spanish', value: 'es' },
          { name: '🇫🇷 French', value: 'fr' },
          { name: '🇩🇪 German', value: 'de' },
          { name: '🇮🇹 Italian', value: 'it' },
          { name: '🇵🇹 Portuguese', value: 'pt' },
          { name: '🇷🇺 Russian', value: 'ru' },
          { name: '🇯🇵 Japanese', value: 'ja' },
          { name: '🇰🇷 Korean', value: 'ko' },
          { name: '🇨🇳 Chinese (Simplified)', value: 'zh-CN' },
          { name: '🇨🇳 Chinese (Traditional)', value: 'zh-TW' },
          { name: '🇸🇦 Arabic', value: 'ar' },
          { name: '🇮🇳 Hindi', value: 'hi' },
          { name: '🇹🇷 Turkish', value: 'tr' },
          { name: '🇳🇱 Dutch', value: 'nl' },
          { name: '🇸🇪 Swedish', value: 'sv' },
          { name: '🇳🇴 Norwegian', value: 'no' },
          { name: '🇩🇰 Danish', value: 'da' },
          { name: '🇫🇮 Finnish', value: 'fi' },
          { name: '🇵🇱 Polish', value: 'pl' },
          { name: '🇨🇿 Czech', value: 'cs' },
          { name: '🇭🇺 Hungarian', value: 'hu' },
          { name: '🇷🇴 Romanian', value: 'ro' },
          { name: '🇬🇷 Greek', value: 'el' },
          { name: '🇹🇭 Thai', value: 'th' },
          { name: '🇻🇳 Vietnamese', value: 'vi' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('source')
        .setDescription('The source language (auto-detect if not specified)')
        .setRequired(false)
        .addChoices(
          { name: '🔍 Auto-detect', value: 'auto' },
          { name: '🇺🇸 English', value: 'en' },
          { name: '🇪🇸 Spanish', value: 'es' },
          { name: '🇫🇷 French', value: 'fr' },
          { name: '🇩🇪 German', value: 'de' },
          { name: '🇮🇹 Italian', value: 'it' },
          { name: '🇵🇹 Portuguese', value: 'pt' },
          { name: '🇷🇺 Russian', value: 'ru' },
          { name: '🇯🇵 Japanese', value: 'ja' },
          { name: '🇰🇷 Korean', value: 'ko' },
          { name: '🇨🇳 Chinese', value: 'zh' }
        )
    ),

  async execute(interaction) {
    const text = interaction.options.getString('text');
    const targetLanguage = interaction.options.getString('target') || 'en';
    const sourceLanguage = interaction.options.getString('source') || 'auto';

    // Show loading message
    const loadingEmbed = UIUtils.createAnimatedEmbed(
      '🌐 Translating Text',
      `${UIUtils.getLoadingSpinner()} Translating your text...`,
      UIUtils.colors.info,
      'loading'
    );

    await interaction.reply({ embeds: [loadingEmbed] });

    try {
      // Detect language if auto is selected
      let detectedLanguage = sourceLanguage;
      if (sourceLanguage === 'auto') {
        const detectionResult = await translate(text, { to: 'en' });
        detectedLanguage = detectionResult.from.language.iso;
      }

      // Perform translation
      const translationResult = await translate(text, { 
        from: detectedLanguage === 'auto' ? undefined : detectedLanguage,
        to: targetLanguage 
      });

      const translationEmbed = this.createTranslationEmbed(
        text,
        translationResult,
        detectedLanguage,
        targetLanguage
      );

      const buttons = this.createTranslationButtons(text, targetLanguage, detectedLanguage);

      await interaction.editReply({
        embeds: [translationEmbed],
        components: [buttons]
      });

    } catch (error) {
      console.error('Translation error:', error);
      
      const errorEmbed = UIUtils.createErrorEmbed(
        error,
        '❌ Translation Failed',
        [
          'Check if the text is valid',
          'Verify the language codes are correct',
          'Try using a different language combination',
          'Ensure the text is not too long'
        ]
      );

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  createTranslationEmbed(originalText, translationResult, sourceLang, targetLang) {
    const sourceLangName = this.getLanguageName(sourceLang);
    const targetLangName = this.getLanguageName(targetLang);
    const sourceFlag = this.getLanguageFlag(sourceLang);
    const targetFlag = this.getLanguageFlag(targetLang);

    const embed = UIUtils.createAnimatedEmbed(
      `${sourceFlag} → ${targetFlag} Translation`,
      `**${sourceLangName} → ${targetLangName}**\n\n**Original Text:**\n\`\`\`${originalText}\`\`\`\n\n**Translated Text:**\n\`\`\`${translationResult.text}\`\`\``,
      UIUtils.colors.primary,
      'success',
      [
        {
          name: '🌍 Language Details',
          value: `**From:** ${sourceFlag} ${sourceLangName} (${sourceLang.toUpperCase()})\n**To:** ${targetFlag} ${targetLangName} (${targetLang.toUpperCase()})`,
          inline: true
        },
        {
          name: '📊 Translation Info',
          value: `**Confidence:** ${translationResult.from?.text?.autoCorrected ? 'Auto-corrected' : 'High'}\n**Characters:** ${originalText.length} → ${translationResult.text.length}`,
          inline: true
        }
      ],
      { text: 'Powered by Google Translate • Click buttons for more options' }
    );

    return embed;
  },

  createTranslationButtons(originalText, targetLang, sourceLang) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`translate_back_${targetLang}_${sourceLang}`)
          .setLabel('🔄 Translate Back')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`translate_audio_${targetLang}`)
          .setLabel('🔊 Audio')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`translate_alternatives_${targetLang}`)
          .setLabel('📝 Alternatives')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel('🌐 Language Codes')
          .setStyle(ButtonStyle.Link)
          .setURL('https://cloud.google.com/translate/docs/languages')
      );

    return row;
  },

  getLanguageName(code) {
    const languages = {
      'auto': 'Auto-detect',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'tr': 'Turkish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'el': 'Greek',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'tr': 'Turkish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'el': 'Greek',
      'th': 'Thai',
      'vi': 'Vietnamese'
    };

    return languages[code] || code.toUpperCase();
  },

  getLanguageFlag(code) {
    const flags = {
      'auto': '🔍',
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ru': '🇷🇺',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'zh': '🇨🇳',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'tr': '🇹🇷',
      'nl': '🇳🇱',
      'sv': '🇸🇪',
      'no': '🇳🇴',
      'da': '🇩🇰',
      'fi': '🇫🇮',
      'pl': '🇵🇱',
      'cs': '🇨🇿',
      'hu': '🇭🇺',
      'ro': '🇷🇴',
      'el': '🇬🇷',
      'th': '🇹🇭',
      'vi': '🇻🇳',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'tr': '🇹🇷',
      'nl': '🇳🇱',
      'sv': '🇸🇪',
      'no': '🇳🇴',
      'da': '🇩🇰',
      'fi': '🇫🇮',
      'pl': '🇵🇱',
      'cs': '🇨🇿',
      'hu': '🇭🇺',
      'ro': '🇷🇴',
      'el': '🇬🇷',
      'th': '🇹🇭',
      'vi': '🇻🇳'
    };

    return flags[code] || '🌐';
  }
};
