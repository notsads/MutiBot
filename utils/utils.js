function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createProgressBar(current, total, size = 15) {
  const progress = Math.round((current / total) * size);
  return '▬'.repeat(progress) + '🔘' + '▬'.repeat(size - progress);
}

// Enhanced console utilities
function logSuccess(message) {
  console.log(global.styles.successColor(`✅ ${message}`));
}

function logWarning(message) {
  console.log(global.styles.warningColor(`⚠️  ${message}`));
}

function logError(message) {
  console.log(global.styles.errorColor(`❌ ${message}`));
}

function logInfo(message) {
  console.log(global.styles.infoColor(`ℹ️  ${message}`));
}

function logCommand(command, description) {
  console.log(`${global.styles.commandColor('🔸')} ${global.styles.primaryColor(command)} - ${global.styles.secondaryColor(description)}`);
}

function createDivider(char = '═', length = 60) {
  return global.styles.dividerColor(char.repeat(length));
}

function logSection(title) {
  console.log(`\n${createDivider()}`);
  console.log(global.styles.highlightColor(`📂 ${title.toUpperCase()}`));
  console.log(createDivider());
}

function logStats(stats) {
  console.log(`\n${createDivider()}`);
  console.log(global.styles.accentColor('📊 BOT STATISTICS'));
  console.log(createDivider());
  
  Object.entries(stats).forEach(([key, value]) => {
    const icon = getStatIcon(key);
    console.log(`${global.styles.infoColor(`${icon} ${key}:`)} ${global.styles.userColor(value)}`);
  });
  console.log(createDivider());
}

function getStatIcon(stat) {
  const icons = {
    'Servers': '🌍',
    'Users': '👥',
    'Uptime': '⏰',
    'Memory': '💾',
    'CPU': '🔧',
    'Status': '📡'
  };
  return icons[stat] || '📊';
}

// Enhanced embed utilities
function createEmbedBuilder() {
  return {
    success: (title, description) => ({
      color: 0x4CAF50,
      title: `✅ ${title}`,
      description,
      timestamp: new Date()
    }),
    error: (title, description) => ({
      color: 0xF44336,
      title: `❌ ${title}`,
      description,
      timestamp: new Date()
    }),
    warning: (title, description) => ({
      color: 0xFF9800,
      title: `⚠️ ${title}`,
      description,
      timestamp: new Date()
    }),
    info: (title, description) => ({
      color: 0x2196F3,
      title: `ℹ️ ${title}`,
      description,
      timestamp: new Date()
    })
  };
}

module.exports = {
  formatTime,
  createProgressBar,
  logSuccess,
  logWarning,
  logError,
  logInfo,
  logCommand,
  createDivider,
  logSection,
  logStats,
  createEmbedBuilder
};
