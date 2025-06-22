const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'embed_builder') return;

    try {
      const title = interaction.fields.getTextInputValue('embed_title');
      const description = interaction.fields.getTextInputValue('embed_description');
      const color = interaction.fields.getTextInputValue('embed_color');
      const authorInput = interaction.fields.getTextInputValue('embed_author');
      const fieldsInput = interaction.fields.getTextInputValue('embed_fields');

      // Validate color format
      let embedColor = 0x5865f2; // Default Discord blue
      if (color) {
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          embedColor = parseInt(color.replace('#', ''), 16);
        } else {
          return interaction.reply({
            content: '❌ Invalid color format! Please use a valid hex color (e.g., #FF6B6B)',
            ephemeral: true,
          });
        }
      }

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setColor(embedColor)
        .setTimestamp()
        .setFooter({
          text: `Created by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      if (title) embed.setTitle(title);

      if (authorInput && authorInput.trim()) {
        const [authorName, authorUrl, authorIconUrl] = authorInput.split('|');
        if (authorName) {
          embed.setAuthor({
            name: authorName.trim(),
            url: authorUrl?.trim() || null,
            iconURL: authorIconUrl?.trim() || null,
          });
        }
      }

      if (fieldsInput && fieldsInput.trim()) {
        const fields = fieldsInput.split('\n').map((field) => {
          const [name, value, inline] = field.split('|');
          return {
            name: name?.trim() || '\u200b',
            value: value?.trim() || '\u200b',
            inline: inline?.trim().toLowerCase() === 'true',
          };
        });
        embed.addFields(fields);
      }

      // Send the embed
      await interaction.channel.send({ embeds: [embed] });

      // Send success confirmation
      const successEmbed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('✅ Embed Created Successfully!')
        .setDescription('Your custom embed has been sent to the channel.')
        .addFields({
          name: '📝 Details',
          value: `Title: ${title || 'None'}\nColor: ${color || 'Default'}\nFields: ${fieldsInput ? fieldsInput.split('\n').length : 0}`,
          inline: true
        })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error('Error creating embed:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('❌ Error Creating Embed')
        .setDescription('An error occurred while creating your embed. Please check your inputs and try again.')
        .addFields({
          name: '💡 Common Issues',
          value: '• Invalid color format (use #RRGGBB)\n• Field format errors\n• URL format issues',
          inline: false
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  },
};
