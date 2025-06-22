const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class UIUtils {
  // Color constants for consistent theming
  static colors = {
    success: 0x4CAF50,
    error: 0xFF6B6B,
    warning: 0xFF9800,
    info: 0x2196F3,
    primary: 0x4ECDC4,
    secondary: 0x607D8B,
    purple: 0x9C27B0,
    gold: 0xFFD700,
    silver: 0xC0C0C0,
    bronze: 0xCD7F32
  };

  // Create animated progress bar
  static createProgressBar(current, total, width = 20, showPercentage = true) {
    const percentage = Math.round((current / total) * 100);
    const filledBlocks = Math.round((percentage / 100) * width);
    const emptyBlocks = width - filledBlocks;
    
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    return showPercentage ? `${filled}${empty} ${percentage}%` : `${filled}${empty}`;
  }

  // Create loading spinner
  static getLoadingSpinner() {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return spinners[Math.floor(Date.now() / 100) % spinners.length];
  }

  // Create status indicator
  static getStatusIndicator(status) {
    const indicators = {
      online: '🟢',
      idle: '🟡',
      dnd: '🔴',
      offline: '⚫',
      loading: this.getLoadingSpinner(),
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return indicators[status] || '❓';
  }

  // Create animated embed with status
  static createAnimatedEmbed(title, description, color, status = 'info', fields = [], footer = null, thumbnail = null) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${this.getStatusIndicator(status)} ${title}`)
      .setDescription(description)
      .setTimestamp();

    fields.forEach(field => {
      embed.addFields(field);
    });

    if (footer) {
      embed.setFooter(footer);
    }

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    return embed;
  }

  // Create statistics embed
  static createStatsEmbed(title, stats, color = this.colors.primary, footer = null) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📊 ${title}`)
      .setTimestamp();

    Object.entries(stats).forEach(([key, value]) => {
      embed.addFields({
        name: key,
        value: typeof value === 'number' ? value.toLocaleString() : value,
        inline: true
      });
    });

    if (footer) {
      embed.setFooter(footer);
    }

    return embed;
  }

  // Create confirmation dialog
  static createConfirmationDialog(title, description, confirmLabel = '✅ Confirm', cancelLabel = '❌ Cancel') {
    const embed = new EmbedBuilder()
      .setColor(this.colors.warning)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setTimestamp();

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_action')
          .setLabel(confirmLabel)
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('cancel_action')
          .setLabel(cancelLabel)
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    return { embed, buttons };
  }

  // Create pagination controls
  static createPaginationControls(currentPage, totalPages, customIds = {}) {
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(customIds.first || 'first_page')
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId(customIds.prev || 'prev_page')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId('page_info')
          .setLabel(`📄 ${currentPage}/${totalPages}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(customIds.next || 'next_page')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages),
        new ButtonBuilder()
          .setCustomId(customIds.last || 'last_page')
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages)
      );

    return buttons;
  }

  // Create action buttons row
  static createActionButtons(actions, style = 'primary') {
    const buttons = new ActionRowBuilder();
    
    actions.forEach(action => {
      const button = new ButtonBuilder()
        .setCustomId(action.id)
        .setLabel(action.label)
        .setStyle(this.getButtonStyle(action.style || style))
        .setDisabled(action.disabled || false);

      if (action.emoji) {
        button.setEmoji(action.emoji);
      }

      buttons.addComponents(button);
    });

    return buttons;
  }

  // Get button style from string
  static getButtonStyle(style) {
    const styles = {
      primary: ButtonStyle.Primary,
      secondary: ButtonStyle.Secondary,
      success: ButtonStyle.Success,
      danger: ButtonStyle.Danger
    };
    return styles[style] || ButtonStyle.Primary;
  }

  // Create rich error embed
  static createErrorEmbed(error, title = '❌ Error Occurred', suggestions = []) {
    const embed = new EmbedBuilder()
      .setColor(this.colors.error)
      .setTitle(title)
      .setDescription('An error occurred while processing your request.')
      .addFields({
        name: '🔍 Error Details',
        value: `\`\`\`${error.message}\`\`\``,
        inline: false
      })
      .setTimestamp();

    if (suggestions.length > 0) {
      embed.addFields({
        name: '💡 Suggestions',
        value: suggestions.map(s => `• ${s}`).join('\n'),
        inline: false
      });
    }

    return embed;
  }

  // Create success embed
  static createSuccessEmbed(title, description, fields = [], footer = null) {
    const embed = new EmbedBuilder()
      .setColor(this.colors.success)
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setTimestamp();

    fields.forEach(field => {
      embed.addFields(field);
    });

    if (footer) {
      embed.setFooter(footer);
    }

    return embed;
  }

  // Create info embed
  static createInfoEmbed(title, description, fields = [], footer = null) {
    const embed = new EmbedBuilder()
      .setColor(this.colors.info)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setTimestamp();

    fields.forEach(field => {
      embed.addFields(field);
    });

    if (footer) {
      embed.setFooter(footer);
    }

    return embed;
  }

  // Create warning embed
  static createWarningEmbed(title, description, fields = [], footer = null) {
    const embed = new EmbedBuilder()
      .setColor(this.colors.warning)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setTimestamp();

    fields.forEach(field => {
      embed.addFields(field);
    });

    if (footer) {
      embed.setFooter(footer);
    }

    return embed;
  }

  // Format bytes to human readable
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration in milliseconds
  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Create user mention with avatar
  static createUserMention(user) {
    return `<@${user.id}>`;
  }

  // Create role mention
  static createRoleMention(role) {
    return `<@&${role.id}>`;
  }

  // Create channel mention
  static createChannelMention(channel) {
    return `<#${channel.id}>`;
  }

  // Get ordinal suffix
  static getOrdinalSuffix(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  // Create timestamp
  static createTimestamp(date, format = 'F') {
    return `<t:${Math.floor(date.getTime() / 1000)}:${format}>`;
  }

  // Create relative timestamp
  static createRelativeTimestamp(date) {
    return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
  }

  // Create animated loading message
  static async createLoadingMessage(interaction, title, description) {
    const loadingEmbed = this.createAnimatedEmbed(
      title,
      description,
      this.colors.info,
      'loading'
    );

    return await interaction.editReply({ embeds: [loadingEmbed] });
  }

  // Create paginated embed
  static createPaginatedEmbed(items, itemsPerPage, currentPage, title, color = this.colors.primary) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(`Page ${currentPage} of ${totalPages}`)
      .setTimestamp()
      .setFooter({
        text: `Showing ${startIndex + 1}-${Math.min(endIndex, items.length)} of ${items.length} items`
      });

    pageItems.forEach((item, index) => {
      embed.addFields({
        name: `${startIndex + index + 1}. ${item.name || item.title || 'Item'}`,
        value: item.description || item.value || 'No description available',
        inline: false
      });
    });

    return { embed, totalPages, currentPage };
  }
}

module.exports = UIUtils; 