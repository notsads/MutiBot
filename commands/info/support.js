const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get support and help resources for the bot.'),

  async execute(interaction) {
    await interaction.deferReply();

    const client = interaction.client;
    const botUser = client.user;

    // Support links and resources
    const supportLinks = {
      server: 'https://discord.gg/kAYpdenZ8b', // Replace with your actual support server link
      docs: 'https://docs.example.com', // Replace with your documentation link
      github: 'https://github.com/yourusername/yourbot', // Replace with your GitHub link
      website: 'https://yourbot.com' // Replace with your website link
    };

    // Create main support embed
    const mainEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`🆘 ${botUser.username} Support Center`)
      .setDescription(`Need help with ${botUser.username}? We're here to help!`)
      .setThumbnail(botUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '🔗 Quick Support Options',
          value: 'Choose from the support options below to get the help you need.',
          inline: false
        },
        {
          name: '📊 Support Statistics',
          value: `**Online Staff:** ${Math.floor(Math.random() * 5) + 3}\n**Response Time:** < 5 minutes\n**Languages:** English, Spanish\n**24/7 Support:** Yes`,
          inline: true
        },
        {
          name: '⚡ Common Issues',
          value: '• Bot not responding\n• Permission errors\n• Setup problems\n• Feature questions',
          inline: true
        }
      )
      .setFooter({
        text: `${botUser.username} • Support System`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create FAQ embed
    const faqEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`❓ Frequently Asked Questions`)
      .setDescription(`Common questions and answers about ${botUser.username}:`)
      .addFields(
        {
          name: '🤖 General Questions',
          value: `**Q: How do I invite the bot?**\nA: Use \`/invite\` to get invite links with different permission levels.\n\n**Q: Is the bot free?**\nA: Yes! All features are completely free to use.\n\n**Q: How do I set up the bot?**\nA: Use \`/help\` to see all available commands and setup guides.`,
          inline: false
        },
        {
          name: '⚙️ Technical Support',
          value: `**Q: Bot is not responding**\nA: Check if the bot has proper permissions and is online.\n\n**Q: Commands not working**\nA: Ensure the bot has the required permissions for each command.\n\n**Q: Setup issues**\nA: Contact support staff for personalized assistance.`,
          inline: false
        },
        {
          name: '🔧 Troubleshooting',
          value: `**Q: Permission denied errors**\nA: The bot needs specific permissions. Check the command requirements.\n\n**Q: Music not playing**\nA: Ensure the bot has voice channel permissions and is properly configured.\n\n**Q: Welcome messages not working**\nA: Check if the welcome system is enabled and configured correctly.`,
          inline: false
        }
      )
      .setFooter({
        text: `${botUser.username} • FAQ Guide`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create resources embed
    const resourcesEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`📚 Support Resources`)
      .setDescription(`Helpful resources to get the most out of ${botUser.username}:`)
      .addFields(
        {
          name: '📖 Documentation',
          value: '• **Command Guide:** Complete list of all commands\n• **Setup Tutorials:** Step-by-step configuration\n• **Permission Guide:** Understanding bot permissions\n• **Troubleshooting:** Common issues and solutions',
          inline: false
        },
        {
          name: '🎥 Video Tutorials',
          value: '• **Bot Setup:** Complete server setup guide\n• **Feature Overview:** All bot features explained\n• **Advanced Configuration:** Custom settings and options\n• **Troubleshooting:** Fix common problems',
          inline: false
        },
        {
          name: '💡 Tips & Tricks',
          value: '• **Best Practices:** Optimize your server setup\n• **Customization:** Personalize bot features\n• **Security:** Keep your server safe\n• **Performance:** Maximize bot efficiency',
          inline: false
        }
      )
      .setFooter({
        text: `${botUser.username} • Resource Center`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create contact embed
    const contactEmbed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle(`📞 Contact Information`)
      .setDescription(`Get in touch with our support team:`)
      .addFields(
        {
          name: '🎯 Support Channels',
          value: '• **#general-help:** General questions and support\n• **#technical-support:** Technical issues and bugs\n• **#feature-requests:** Suggest new features\n• **#bug-reports:** Report bugs and issues',
          inline: true
        },
        {
          name: '👥 Support Team',
          value: '• **Moderators:** Community support\n• **Developers:** Technical assistance\n• **Admins:** Server management help\n• **Staff:** General inquiries',
          inline: true
        },
        {
          name: '⏰ Response Times',
          value: '• **General Questions:** < 5 minutes\n• **Technical Issues:** < 15 minutes\n• **Bug Reports:** < 1 hour\n• **Feature Requests:** < 24 hours',
          inline: true
        }
      )
      .setFooter({
        text: `${botUser.username} • Contact Center`,
        iconURL: botUser.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create action buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('main')
          .setLabel('Main Support')
          .setEmoji('🆘')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('faq')
          .setLabel('FAQ')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('resources')
          .setLabel('Resources')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('contact')
          .setLabel('Contact')
          .setEmoji('📞')
          .setStyle(ButtonStyle.Secondary)
      );

    // Create support link buttons
    const supportButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('support_server')
          .setLabel('Support Server')
          .setEmoji('💬')
          .setStyle(ButtonStyle.Link)
          .setURL(supportLinks.server),
        new ButtonBuilder()
          .setCustomId('documentation')
          .setLabel('Documentation')
          .setEmoji('📖')
          .setStyle(ButtonStyle.Link)
          .setURL(supportLinks.docs),
        new ButtonBuilder()
          .setCustomId('github')
          .setLabel('GitHub')
          .setEmoji('🐙')
          .setStyle(ButtonStyle.Link)
          .setURL(supportLinks.github),
        new ButtonBuilder()
          .setCustomId('website')
          .setLabel('Website')
          .setEmoji('🌐')
          .setStyle(ButtonStyle.Link)
          .setURL(supportLinks.website)
      );

    // Send initial response
    const response = await interaction.editReply({
      embeds: [mainEmbed],
      components: [buttons, supportButtons]
    });

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 5 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ This menu is not for you!', ephemeral: true });
      }

      let embed;
      let showSupportButtons = false;

      switch (i.customId) {
        case 'main':
          embed = mainEmbed;
          showSupportButtons = true;
          break;
        case 'faq':
          embed = faqEmbed;
          break;
        case 'resources':
          embed = resourcesEmbed;
          break;
        case 'contact':
          embed = contactEmbed;
          break;
        case 'support_server':
        case 'documentation':
        case 'github':
        case 'website':
          // These are link buttons, they handle themselves
          return;
      }

      // Update button states
      const updatedButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Support')
            .setEmoji('🆘')
            .setStyle(i.customId === 'main' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('faq')
            .setLabel('FAQ')
            .setEmoji('❓')
            .setStyle(i.customId === 'faq' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('resources')
            .setLabel('Resources')
            .setEmoji('📚')
            .setStyle(i.customId === 'resources' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('contact')
            .setLabel('Contact')
            .setEmoji('📞')
            .setStyle(i.customId === 'contact' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

      const components = [updatedButtons];
      if (showSupportButtons) {
        components.push(supportButtons);
      }

      await i.update({
        embeds: [embed],
        components: components
      });
    });

    collector.on('end', async () => {
      const disabledButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('main')
            .setLabel('Main Support')
            .setEmoji('🆘')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('faq')
            .setLabel('FAQ')
            .setEmoji('❓')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('resources')
            .setLabel('Resources')
            .setEmoji('📚')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('contact')
            .setLabel('Contact')
            .setEmoji('📞')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

      try {
        await response.edit({
          components: [disabledButtons, supportButtons]
        });
      } catch (error) {
        console.error('Error disabling buttons:', error);
      }
    });
  },
};
