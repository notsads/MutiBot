const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { logSuccess, logError, logInfo, logWarning } = require('../utils/utils');

module.exports = async (client) => {
  client.commands = new Collection();
  client.commandUsage = new Collection(); // Track command usage for analytics

  const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));

  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(path.join(__dirname, '../commands', folder))
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`);
      
      // Add category information to command
      command.category = folder;
      
      // Initialize usage tracking for this command
      client.commandUsage.set(command.data.name, {
        count: 0,
        lastUsed: null,
        users: new Set(),
        errors: 0
      });

      client.commands.set(command.data.name, command);
    }
  }

  // Log command loading
  logSuccess(`✅ Successfully loaded ${client.commands.size} commands`);
  
  // Log command categories
  const categories = [...new Set(Array.from(client.commands.values()).map(cmd => cmd.category))];
  logInfo(`📂 Command categories: ${categories.join(', ')}`);
};
