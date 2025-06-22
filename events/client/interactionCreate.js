const { Events, MessageFlags } = require('discord.js');
const { logSuccess, logError, logInfo, logWarning } = require('../../utils/utils');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        logError(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      // Enhanced command usage tracking
      if (!interaction.client.commandUsage) {
        interaction.client.commandUsage = new Map();
      }

      const usage = interaction.client.commandUsage.get(interaction.commandName) || {
        count: 0,
        errors: 0,
        lastUsed: null,
        users: new Set(),
        avgResponseTime: 0,
        totalResponseTime: 0
      };

      // Track command usage for analytics
      usage.count++;
      usage.lastUsed = new Date();
      usage.users.add(interaction.user.id);
      interaction.client.commandUsage.set(interaction.commandName, usage);

      // Performance tracking
      const startTime = Date.now();
      let responseTime = 0;

      try {
        // Log command start
        logInfo(`🎯 Command started: ${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
        
        await command.execute(interaction);
        
        // Calculate response time
        responseTime = Date.now() - startTime;
        usage.totalResponseTime += responseTime;
        usage.avgResponseTime = usage.totalResponseTime / usage.count;
        
        // Log successful command execution with performance metrics
        logSuccess(`✅ Command completed: ${interaction.commandName} by ${interaction.user.tag} in ${responseTime}ms`);
        
        // Log detailed analytics
        if (usage.count % 10 === 0) { // Log every 10th usage
          logInfo(`📊 Command Analytics - ${interaction.commandName}:`);
          logInfo(`   Total Uses: ${usage.count}`);
          logInfo(`   Unique Users: ${usage.users.size}`);
          logInfo(`   Avg Response Time: ${usage.avgResponseTime.toFixed(2)}ms`);
          logInfo(`   Error Rate: ${((usage.errors / usage.count) * 100).toFixed(2)}%`);
        }
        
      } catch (error) {
        // Calculate response time for errors
        responseTime = Date.now() - startTime;
        usage.totalResponseTime += responseTime;
        usage.avgResponseTime = usage.totalResponseTime / usage.count;
        usage.errors++;
        
        console.error(`❌ Error executing command ${interaction.commandName}:`, error);
        
        // Enhanced error response with UIUtils
        const errorEmbed = UIUtils.createErrorEmbed(
          error,
          'Command Execution Error',
          [
            'Try using the command again',
            'Check if you have the required permissions',
            'Verify the command syntax is correct',
            'Contact support if the issue persists'
          ]
        );

        // Add command-specific error information
        errorEmbed.addFields({
          name: '🔍 Command Details',
          value: `**Command:** \`/${interaction.commandName}\`\n**User:** ${interaction.user.tag}\n**Guild:** ${interaction.guild?.name || 'DM'}\n**Response Time:** ${responseTime}ms`,
          inline: true
        });

        // Add performance metrics
        errorEmbed.addFields({
          name: '📊 Performance Metrics',
          value: `**Total Uses:** ${usage.count}\n**Error Rate:** ${((usage.errors / usage.count) * 100).toFixed(2)}%\n**Avg Response:** ${usage.avgResponseTime.toFixed(2)}ms`,
          inline: true
        });

        // Send error response with proper interaction handling
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
              embeds: [errorEmbed], 
              flags: [MessageFlags.Ephemeral] 
            });
          } else {
            await interaction.reply({ 
              embeds: [errorEmbed], 
              flags: [MessageFlags.Ephemeral] 
            });
          }
        } catch (replyError) {
          console.error('Failed to send error response:', replyError);
          
          // Fallback error message
          try {
            const fallbackEmbed = UIUtils.createErrorEmbed(
              new Error('Failed to send detailed error response'),
              'Error Response Failed',
              [
                'The command encountered an error',
                'Please try again later',
                'Contact support if the issue persists'
              ]
            );
            
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp({ 
                embeds: [fallbackEmbed], 
                flags: [MessageFlags.Ephemeral] 
              });
            } else {
              await interaction.reply({ 
                embeds: [fallbackEmbed], 
                flags: [MessageFlags.Ephemeral] 
              });
            }
          } catch (fallbackError) {
            console.error('Failed to send fallback error response:', fallbackError);
          }
        }

        logError(`Command error: ${interaction.commandName} - ${error.message} (${responseTime}ms)`);
      }
    }

    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (command && command.autocomplete) {
        const startTime = Date.now();
        
        try {
          await command.autocomplete(interaction);
          
          const responseTime = Date.now() - startTime;
          logInfo(`🔍 Autocomplete completed: ${interaction.commandName} in ${responseTime}ms`);
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          console.error('Autocomplete error:', error);
          
          try {
            await interaction.respond([]);
          } catch (respondError) {
            console.error('Failed to respond to autocomplete:', respondError);
          }
          
          logError(`Autocomplete error: ${interaction.commandName} - ${error.message} (${responseTime}ms)`);
        }
      }
    }

    if (interaction.isButton()) {
      // Track button interactions
      if (!interaction.client.buttonUsage) {
        interaction.client.buttonUsage = new Map();
      }

      const buttonId = interaction.customId;
      const buttonUsage = interaction.client.buttonUsage.get(buttonId) || {
        count: 0,
        users: new Set(),
        lastUsed: null
      };

      buttonUsage.count++;
      buttonUsage.lastUsed = new Date();
      buttonUsage.users.add(interaction.user.id);
      interaction.client.buttonUsage.set(buttonId, buttonUsage);

      logInfo(`🔘 Button clicked: ${buttonId} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
    }

    if (interaction.isStringSelectMenu()) {
      // Track select menu interactions
      if (!interaction.client.selectUsage) {
        interaction.client.selectUsage = new Map();
      }

      const selectId = interaction.customId;
      const selectUsage = interaction.client.selectUsage.get(selectId) || {
        count: 0,
        users: new Set(),
        lastUsed: null,
        options: new Map()
      };

      selectUsage.count++;
      selectUsage.lastUsed = new Date();
      selectUsage.users.add(interaction.user.id);
      
      // Track selected options
      interaction.values.forEach(value => {
        const optionCount = selectUsage.options.get(value) || 0;
        selectUsage.options.set(value, optionCount + 1);
      });
      
      interaction.client.selectUsage.set(selectId, selectUsage);

      logInfo(`📋 Select menu used: ${selectId} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
    }

    // Periodic analytics logging
    if (!interaction.client.lastAnalyticsLog) {
      interaction.client.lastAnalyticsLog = Date.now();
    }

    // Log analytics every 5 minutes
    if (Date.now() - interaction.client.lastAnalyticsLog > 300000) {
      logInfo('📊 INTERACTION ANALYTICS SUMMARY:');
      
      if (interaction.client.commandUsage) {
        const totalCommands = Array.from(interaction.client.commandUsage.values()).reduce((acc, usage) => acc + usage.count, 0);
        const totalErrors = Array.from(interaction.client.commandUsage.values()).reduce((acc, usage) => acc + usage.errors, 0);
        const avgResponseTime = Array.from(interaction.client.commandUsage.values()).reduce((acc, usage) => acc + usage.avgResponseTime, 0) / interaction.client.commandUsage.size;
        
        logInfo(`   Commands: ${totalCommands} total, ${totalErrors} errors, ${avgResponseTime.toFixed(2)}ms avg response`);
      }
      
      if (interaction.client.buttonUsage) {
        const totalButtons = Array.from(interaction.client.buttonUsage.values()).reduce((acc, usage) => acc + usage.count, 0);
        logInfo(`   Buttons: ${totalButtons} total clicks`);
      }
      
      if (interaction.client.selectUsage) {
        const totalSelects = Array.from(interaction.client.selectUsage.values()).reduce((acc, usage) => acc + usage.count, 0);
        logInfo(`   Select Menus: ${totalSelects} total uses`);
      }
      
      interaction.client.lastAnalyticsLog = Date.now();
    }
  },
};
