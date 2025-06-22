const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memegenerator')
    .setDescription('Create custom memes with text overlays on popular templates.')
    .addStringOption(option =>
      option.setName('template')
        .setDescription('Choose a meme template')
        .setRequired(false)
        .addChoices(
          { name: '😎 Drake (Yes/No)', value: 'drake' },
          { name: '🤔 Distracted Boyfriend', value: 'distracted' },
          { name: '😤 Two Buttons', value: 'two-buttons' },
          { name: '😱 Change My Mind', value: 'change-my-mind' },
          { name: '🤷‍♂️ Shrugging Guy', value: 'shrug' },
          { name: '😅 One Does Not Simply', value: 'one-does-not-simply' },
          { name: '😤 Success Kid', value: 'success-kid' },
          { name: '😭 Y U No', value: 'y-u-no' },
          { name: '🎭 Ancient Aliens', value: 'ancient-aliens' },
          { name: '😎 Bad Luck Brian', value: 'bad-luck-brian' }
        )
    ),

  async execute(interaction) {
    const template = interaction.options.getString('template') || 'drake';

    // Create template selection embed
    const templateEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🎨 Meme Generator')
      .setDescription('Choose a meme template and add your custom text!')
      .addFields(
        {
          name: '📋 Available Templates',
          value: '• **Drake** - Yes/No format\n• **Distracted Boyfriend** - Comparison format\n• **Two Buttons** - Choice format\n• **Change My Mind** - Opinion format\n• **Shrugging Guy** - Indifference format',
          inline: false
        },
        {
          name: '🎯 How to Use',
          value: '1. Select a template (or use the current one)\n2. Click "Create Meme" to open the text editor\n3. Add your custom text\n4. Generate your meme!',
          inline: false
        },
        {
          name: '📊 Current Template',
          value: this.getTemplateName(template),
          inline: true
        },
        {
          name: '💡 Tips',
          value: '• Keep text short and punchy\n• Use emojis for extra impact\n• Be creative with your captions!',
          inline: true
        }
      )
      .setFooter({
        text: 'Click "Create Meme" to start building your masterpiece!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create action buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_meme')
          .setLabel('Create Meme')
          .setEmoji('🎨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('change_template')
          .setLabel('Change Template')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('view_examples')
          .setLabel('View Examples')
          .setEmoji('👀')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_generator')
          .setLabel('Help')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.reply({
      embeds: [templateEmbed],
      components: [buttons],
      fetchReply: true
    });

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });

    let currentTemplate = template;

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This meme generator is not for you!', ephemeral: true });
      }

      switch (i.customId) {
        case 'create_meme':
          await this.showMemeModal(i, currentTemplate);
          break;
        case 'change_template':
          await this.showTemplateSelector(i, response);
          break;
        case 'view_examples':
          await this.showExamples(i);
          break;
        case 'help_generator':
          await this.showHelp(i);
          break;
        case 'template_drake':
        case 'template_distracted':
        case 'template_two-buttons':
        case 'template_change-my-mind':
        case 'template_shrug':
        case 'template_one-does-not-simply':
        case 'template_success-kid':
        case 'template_y-u-no':
        case 'template_ancient-aliens':
        case 'template_bad-luck-brian':
          currentTemplate = i.customId.replace('template_', '');
          await this.updateTemplateDisplay(i, currentTemplate, response);
          break;
      }
    });

    collector.on('end', async () => {
      const disabledButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_meme')
            .setLabel('Create Meme')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('change_template')
            .setLabel('Change Template')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('view_examples')
            .setLabel('View Examples')
            .setEmoji('👀')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('help_generator')
            .setLabel('Help')
            .setEmoji('❓')
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

  getTemplateName(template) {
    const names = {
      'drake': '😎 Drake (Yes/No)',
      'distracted': '🤔 Distracted Boyfriend',
      'two-buttons': '😤 Two Buttons',
      'change-my-mind': '😱 Change My Mind',
      'shrug': '🤷‍♂️ Shrugging Guy',
      'one-does-not-simply': '😅 One Does Not Simply',
      'success-kid': '😤 Success Kid',
      'y-u-no': '😭 Y U No',
      'ancient-aliens': '🎭 Ancient Aliens',
      'bad-luck-brian': '😎 Bad Luck Brian'
    };
    return names[template] || 'Unknown Template';
  },

  async showMemeModal(interaction, template) {
    const modal = new ModalBuilder()
      .setCustomId(`meme_modal_${template}`)
      .setTitle(`Create ${this.getTemplateName(template)} Meme`);

    const textInputs = this.getTextInputsForTemplate(template);
    
    textInputs.forEach((input, index) => {
      const textInput = new TextInputBuilder()
        .setCustomId(`text_${index}`)
        .setLabel(input.label)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(input.placeholder)
        .setRequired(input.required)
        .setMaxLength(input.maxLength);

      const firstActionRow = new ActionRowBuilder().addComponents(textInput);
      modal.addComponents(firstActionRow);
    });

    await interaction.showModal(modal);
  },

  getTextInputsForTemplate(template) {
    const inputs = {
      'drake': [
        { label: 'Top Text (No)', placeholder: 'Enter text for "No" side', required: true, maxLength: 50 },
        { label: 'Bottom Text (Yes)', placeholder: 'Enter text for "Yes" side', required: true, maxLength: 50 }
      ],
      'distracted': [
        { label: 'Girlfriend', placeholder: 'What the girlfriend represents', required: true, maxLength: 50 },
        { label: 'Boyfriend', placeholder: 'What the boyfriend is looking at', required: true, maxLength: 50 },
        { label: 'Other Girl', placeholder: 'What the other girl represents', required: true, maxLength: 50 }
      ],
      'two-buttons': [
        { label: 'Left Button', placeholder: 'Text for left button', required: true, maxLength: 30 },
        { label: 'Right Button', placeholder: 'Text for right button', required: true, maxLength: 30 },
        { label: 'Person Text', placeholder: 'What the person says', required: false, maxLength: 50 }
      ],
      'change-my-mind': [
        { label: 'Opinion', placeholder: 'Enter your controversial opinion', required: true, maxLength: 100 }
      ],
      'shrug': [
        { label: 'Top Text', placeholder: 'Text above the shrugging guy', required: true, maxLength: 50 },
        { label: 'Bottom Text', placeholder: 'Text below the shrugging guy', required: false, maxLength: 50 }
      ],
      'one-does-not-simply': [
        { label: 'Action', placeholder: 'What one does not simply do', required: true, maxLength: 100 }
      ],
      'success-kid': [
        { label: 'Success', placeholder: 'What the kid succeeded at', required: true, maxLength: 100 }
      ],
      'y-u-no': [
        { label: 'Question', placeholder: 'What you are asking', required: true, maxLength: 100 }
      ],
      'ancient-aliens': [
        { label: 'Theory', placeholder: 'Enter your conspiracy theory', required: true, maxLength: 100 }
      ],
      'bad-luck-brian': [
        { label: 'Bad Luck', placeholder: 'What bad luck happened', required: true, maxLength: 100 }
      ]
    };

    return inputs[template] || inputs['drake'];
  },

  async showTemplateSelector(interaction, response) {
    const templateEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🔄 Choose Meme Template')
      .setDescription('Select a template to create your meme with:')
      .addFields(
        {
          name: '😎 Drake',
          value: 'Perfect for yes/no comparisons',
          inline: true
        },
        {
          name: '🤔 Distracted Boyfriend',
          value: 'Great for showing preferences',
          inline: true
        },
        {
          name: '😤 Two Buttons',
          value: 'Ideal for difficult choices',
          inline: true
        },
        {
          name: '😱 Change My Mind',
          value: 'Express controversial opinions',
          inline: true
        },
        {
          name: '🤷‍♂️ Shrugging Guy',
          value: 'Show indifference or confusion',
          inline: true
        },
        {
          name: '😅 One Does Not Simply',
          value: 'Express difficulty of tasks',
          inline: true
        }
      )
      .setFooter({
        text: 'Click a template button to select it!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const templateButtons1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('template_drake')
          .setLabel('Drake')
          .setEmoji('😎')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_distracted')
          .setLabel('Distracted')
          .setEmoji('🤔')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_two-buttons')
          .setLabel('Two Buttons')
          .setEmoji('😤')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_change-my-mind')
          .setLabel('Change Mind')
          .setEmoji('😱')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_shrug')
          .setLabel('Shrug')
          .setEmoji('🤷‍♂️')
          .setStyle(ButtonStyle.Secondary)
      );

    const templateButtons2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('template_one-does-not-simply')
          .setLabel('One Does Not')
          .setEmoji('😅')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_success-kid')
          .setLabel('Success Kid')
          .setEmoji('😤')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_y-u-no')
          .setLabel('Y U No')
          .setEmoji('😭')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_ancient-aliens')
          .setLabel('Ancient Aliens')
          .setEmoji('🎭')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('template_bad-luck-brian')
          .setLabel('Bad Luck Brian')
          .setEmoji('😎')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({
      embeds: [templateEmbed],
      components: [templateButtons1, templateButtons2]
    });
  },

  async updateTemplateDisplay(interaction, template, response) {
    const templateEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🎨 Meme Generator')
      .setDescription('Choose a meme template and add your custom text!')
      .addFields(
        {
          name: '📋 Available Templates',
          value: '• **Drake** - Yes/No format\n• **Distracted Boyfriend** - Comparison format\n• **Two Buttons** - Choice format\n• **Change My Mind** - Opinion format\n• **Shrugging Guy** - Indifference format',
          inline: false
        },
        {
          name: '🎯 How to Use',
          value: '1. Select a template (or use the current one)\n2. Click "Create Meme" to open the text editor\n3. Add your custom text\n4. Generate your meme!',
          inline: false
        },
        {
          name: '📊 Current Template',
          value: this.getTemplateName(template),
          inline: true
        },
        {
          name: '💡 Tips',
          value: '• Keep text short and punchy\n• Use emojis for extra impact\n• Be creative with your captions!',
          inline: true
        }
      )
      .setFooter({
        text: 'Click "Create Meme" to start building your masterpiece!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_meme')
          .setLabel('Create Meme')
          .setEmoji('🎨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('change_template')
          .setLabel('Change Template')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('view_examples')
          .setLabel('View Examples')
          .setEmoji('👀')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_generator')
          .setLabel('Help')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({
      embeds: [templateEmbed],
      components: [buttons]
    });
  },

  async showExamples(interaction) {
    const examplesEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('👀 Meme Generator Examples')
      .setDescription('Here are some examples of how to use different templates:')
      .addFields(
        {
          name: '😎 Drake Template',
          value: '**Top:** "Study for exam"\n**Bottom:** "Watch Netflix"\n*Perfect for showing preferences*',
          inline: false
        },
        {
          name: '🤔 Distracted Boyfriend',
          value: '**Girlfriend:** "My homework"\n**Boyfriend:** "My phone"\n**Other Girl:** "YouTube"\n*Great for showing distractions*',
          inline: false
        },
        {
          name: '😤 Two Buttons',
          value: '**Left:** "Sleep early"\n**Right:** "Stay up gaming"\n**Person:** "Me"\n*Perfect for difficult choices*',
          inline: false
        },
        {
          name: '😱 Change My Mind',
          value: '**Opinion:** "Pineapple belongs on pizza"\n*Express controversial opinions*',
          inline: false
        },
        {
          name: '🤷‍♂️ Shrugging Guy',
          value: '**Top:** "When someone asks"\n**Bottom:** "What\'s wrong?"\n*Show indifference or confusion*',
          inline: false
        }
      )
      .setFooter({
        text: 'Get creative with your own variations!',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [examplesEmbed],
      ephemeral: true
    });
  },

  async showHelp(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('❓ Meme Generator Help')
      .setDescription('Learn how to create amazing memes with our generator!')
      .addFields(
        {
          name: '🎨 How to Create a Meme',
          value: '1. **Choose Template** - Select from popular meme formats\n2. **Add Text** - Enter your custom captions\n3. **Generate** - Create your meme instantly\n4. **Share** - Post your creation!',
          inline: false
        },
        {
          name: '📝 Text Tips',
          value: '• Keep text short and impactful\n• Use emojis for extra personality\n• Be creative and original\n• Consider your audience',
          inline: false
        },
        {
          name: '🎯 Template Guide',
          value: '• **Drake** - Yes/No comparisons\n• **Distracted Boyfriend** - Showing preferences\n• **Two Buttons** - Difficult choices\n• **Change My Mind** - Controversial opinions\n• **Shrugging Guy** - Indifference/confusion',
          inline: false
        },
        {
          name: '⚠️ Guidelines',
          value: '• Keep content appropriate\n• Respect community guidelines\n• Don\'t use offensive language\n• Be original and creative',
          inline: false
        }
      )
      .setFooter({
        text: 'Ready to create your masterpiece?',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [helpEmbed],
      ephemeral: true
    });
  }
}; 