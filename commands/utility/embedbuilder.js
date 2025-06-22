const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedbuilder')
    .setDescription('Create a beautiful custom embed using an interactive modal'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('embed_builder')
      .setTitle('🎨 Embed Builder - Create Your Custom Embed');

    const titleInput = new TextInputBuilder()
      .setCustomId('embed_title')
      .setLabel('📝 Title (Optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter a catchy title for your embed...')
      .setRequired(false)
      .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('📄 Description (Required)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Write your main message here. You can use **bold**, *italic*, and other markdown formatting!')
      .setRequired(true)
      .setMaxLength(4000);

    const colorInput = new TextInputBuilder()
      .setCustomId('embed_color')
      .setLabel('🎨 Color (Optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('#FF6B6B (Red) | #4ECDC4 (Teal) | #45B7D1 (Blue) | #96CEB4 (Green)')
      .setRequired(false)
      .setMaxLength(7);

    const authorInput = new TextInputBuilder()
      .setCustomId('embed_author')
      .setLabel('👤 Author (Optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Format: Name|URL|IconURL (separate with |)')
      .setRequired(false)
      .setMaxLength(300);

    const fieldsInput = new TextInputBuilder()
      .setCustomId('embed_fields')
      .setLabel('📋 Fields (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Format: Name|Value|Inline\nExample:\nServer Info|This is a great server!|true\nMember Count|1000+ members|false')
      .setRequired(false)
      .setMaxLength(1000);

    const rows = [
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(authorInput),
      new ActionRowBuilder().addComponents(fieldsInput),
    ];

    modal.addComponents(...rows);
    await interaction.showModal(modal);
  },

  async interactionCreate(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'embed_builder') return;
    if (!interaction.member.permissions.has('ManageMessages')) {
      return interaction.reply({
        content:
          'You do not have `ManageMessages` permission to use Embed Builder!',
        ephemeral: true,
      });
    }

    try {
      const title = interaction.fields.getTextInputValue('embed_title');
      const description =
        interaction.fields.getTextInputValue('embed_description');
      const color = interaction.fields.getTextInputValue('embed_color');
      const authorInput = interaction.fields.getTextInputValue('embed_author');
      const fieldsInput = interaction.fields.getTextInputValue('embed_fields');

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setTimestamp();

      if (title) embed.setTitle(title);
      if (color) embed.setColor(color);

      if (authorInput) {
        const [authorName, authorUrl, authorIconUrl] = authorInput.split('|');
        embed.setAuthor({
          name: authorName,
          url: authorUrl || null,
          iconURL: authorIconUrl || null,
        });
      }

      if (fieldsInput) {
        const fields = fieldsInput.split('\n').map((field) => {
          const [name, value, inline] = field.split('|');
          return {
            name: name || '\u200b',
            value: value || '\u200b',
            inline: inline || true,
          };
        });
        embed.addFields(fields);
      }

      await interaction.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating embed:', error);
      await interaction.reply({
        content: 'Error creating embed. Check your inputs and try again.',
        ephemeral: true,
      });
    }
  },
};
