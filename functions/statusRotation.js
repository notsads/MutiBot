const { ActivityType } = require('discord.js');
const { logInfo, logSuccess } = require('../utils/utils');

// Advanced status rotation with multiple types and dynamic content
const statuses = [
  {
    type: ActivityType.Watching,
    text: '{serverCount} servers',
    emoji: '🌍'
  },
  {
    type: ActivityType.Listening,
    text: '{userCount} users',
    emoji: '👥'
  },
  {
    type: ActivityType.Playing,
    text: '/help for commands',
    emoji: '🎮'
  },
  {
    type: ActivityType.Watching,
    text: 'Lanya Bot Dashboard',
    emoji: '📊'
  },
  {
    type: ActivityType.Listening,
    text: 'music in {serverCount} servers',
    emoji: '🎵'
  },
  {
    type: ActivityType.Playing,
    text: 'with {userCount} users',
    emoji: '🎯'
  },
  {
    type: ActivityType.Watching,
    text: 'server security',
    emoji: '🛡️'
  },
  {
    type: ActivityType.Playing,
    text: 'Minecraft integration',
    emoji: '🟩'
  }
];

let currentStatusIndex = 0;
let statusUpdateInterval;

module.exports = (client) => {
  const updateStatus = () => {
    if (!client || !client.isReady()) return;

    const status = statuses[currentStatusIndex];
    const serverCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    // Replace placeholders with actual values
    let statusText = status.text
      .replace('{serverCount}', serverCount.toLocaleString())
      .replace('{userCount}', userCount.toLocaleString());

    // Add emoji if available
    if (status.emoji) {
      statusText = `${status.emoji} ${statusText}`;
    }

    client.user.setActivity(statusText, { type: status.type });

    // Log status change
    logInfo(`Status updated: ${statusText} (${status.type})`);

    // Move to next status
    currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
  };

  // Start status rotation
  const startStatusRotation = () => {
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval);
    }

    // Update status immediately
    updateStatus();

    // Set interval for status rotation (every 30 seconds)
    statusUpdateInterval = setInterval(updateStatus, 30000);

    logSuccess('🔄 Status rotation started');
  };

  // Stop status rotation
  const stopStatusRotation = () => {
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval);
      statusUpdateInterval = null;
      logInfo('⏹️ Status rotation stopped');
    }
  };

  // Set custom status
  const setCustomStatus = (text, type = ActivityType.Playing, emoji = '') => {
    if (!client || !client.isReady()) return;

    const statusText = emoji ? `${emoji} ${text}` : text;
    client.user.setActivity(statusText, { type });
    logInfo(`Custom status set: ${statusText}`);
  };

  // Get current status info
  const getStatusInfo = () => {
    return {
      currentStatus: statuses[currentStatusIndex],
      totalStatuses: statuses.length,
      isRotating: !!statusUpdateInterval,
      nextUpdate: statusUpdateInterval ? '30 seconds' : 'Not rotating'
    };
  };

  // Initialize status rotation when bot is ready
  client.once('ready', () => {
    startStatusRotation();
  });

  // Handle process termination
  process.on('SIGINT', () => {
    stopStatusRotation();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopStatusRotation();
    process.exit(0);
  });

  // Export functions for external use
  return {
    updateStatus,
    startStatusRotation,
    stopStatusRotation,
    setCustomStatus,
    getStatusInfo
  };
};
