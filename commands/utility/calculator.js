const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calculator')
    .setDescription('A beautiful scientific calculator with advanced functions.'),

  async execute(interaction) {
    let currentInput = '';
    let history = [];
    let memory = 0;

    const embed = UIUtils.createAnimatedEmbed(
      '🧮 Scientific Calculator',
      `**Display:**\n\`\`\`${currentInput || '0'}\`\`\`\n\n**History:** ${history.length > 0 ? history.slice(-3).join(' → ') : 'No calculations yet'}`,
      UIUtils.colors.primary,
      'info',
      [
        {
          name: '📊 Memory',
          value: `**Stored:** ${memory}`,
          inline: true
        },
        {
          name: '🔢 Functions',
          value: 'Basic math, scientific functions, memory operations',
          inline: true
        }
      ],
      { text: 'Click buttons to calculate! 🎯' }
    );

    const mainRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('clear')
        .setLabel('C')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️'),
      new ButtonBuilder()
        .setCustomId('pi')
        .setLabel('π')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🥧'),
      new ButtonBuilder()
        .setCustomId('power')
        .setLabel('x²')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚡'),
      new ButtonBuilder()
        .setCustomId('sqrt')
        .setLabel('√')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📐'),
      new ButtonBuilder()
        .setCustomId('memory')
        .setLabel('M')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💾')
    );

    const numberRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('7')
        .setLabel('7')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('8')
        .setLabel('8')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('9')
        .setLabel('9')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('divide')
        .setLabel('÷')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➗'),
      new ButtonBuilder()
        .setCustomId('percent')
        .setLabel('%')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💯')
    );

    const numberRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('4')
        .setLabel('4')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('5')
        .setLabel('5')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('6')
        .setLabel('6')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('multiply')
        .setLabel('×')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✖️'),
      new ButtonBuilder()
        .setCustomId('factorial')
        .setLabel('n!')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎲')
    );

    const numberRow3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('1')
        .setLabel('1')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('2')
        .setLabel('2')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('3')
        .setLabel('3')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('subtract')
        .setLabel('-')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➖'),
      new ButtonBuilder()
        .setCustomId('sin')
        .setLabel('sin')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📐')
    );

    const numberRow4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('0')
        .setLabel('0')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('decimal')
        .setLabel('.')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔹'),
      new ButtonBuilder()
        .setCustomId('equals')
        .setLabel('=')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('add')
        .setLabel('+')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➕'),
      new ButtonBuilder()
        .setCustomId('cos')
        .setLabel('cos')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📐')
    );

    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('←')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙'),
      new ButtonBuilder()
        .setCustomId('open-bracket')
        .setLabel('(')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('close-bracket')
        .setLabel(')')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('clear-history')
        .setLabel('Clear History')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️'),
      new ButtonBuilder()
        .setCustomId('end-session')
        .setLabel('End Session')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔚')
    );

    await interaction.reply({
      embeds: [embed],
      components: [mainRow, numberRow1, numberRow2, numberRow3, numberRow4, controlRow],
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (buttonInteraction) => {
      const buttonId = buttonInteraction.customId;

      try {
        if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(buttonId)) {
          currentInput += buttonId;
        } else if (buttonId === 'decimal') {
          if (!currentInput.endsWith('.') && !currentInput.includes('.')) {
            currentInput += '.';
          }
        } else if (buttonId === 'clear') {
          currentInput = '';
        } else if (buttonId === 'back') {
          currentInput = currentInput.slice(0, -1);
        } else if (buttonId === 'clear-history') {
          history = [];
          memory = 0;
        } else if (buttonId === 'equals') {
          if (currentInput.trim()) {
            const result = evaluateExpression(currentInput);
            const calculation = `${currentInput} = ${result}`;
            history.push(calculation);
            if (history.length > 10) history.shift(); // Keep only last 10 calculations
            currentInput = result.toString();
          }
        } else if (buttonId === 'memory') {
          if (currentInput.trim()) {
            memory = parseFloat(currentInput) || 0;
          } else {
            currentInput = memory.toString();
          }
        } else if (buttonId === 'end-session') {
          collector.stop();
          const endEmbed = UIUtils.createSuccessEmbed(
            '🧮 Calculator Session Ended',
            `**Final Result:** ${currentInput || '0'}\n**Calculations Made:** ${history.length}`,
            [
              {
                name: '📊 Session Summary',
                value: `**Memory Value:** ${memory}\n**History Length:** ${history.length} calculations`,
                inline: false
              }
            ],
            { text: 'Thanks for using the calculator! 🎯' }
          );
          await interaction.editReply({ embeds: [endEmbed], components: [] });
          return;
        } else {
          // Handle operators and functions
          const symbol = getSymbol(buttonId);
          if (symbol !== null) {
            if (currentInput && !currentInput.endsWith(' ')) {
              currentInput += ` ${symbol} `;
            } else {
              currentInput += symbol;
            }
          }
        }

        // Update embed
        const updatedEmbed = UIUtils.createAnimatedEmbed(
          '🧮 Scientific Calculator',
          `**Display:**\n\`\`\`${currentInput || '0'}\`\`\`\n\n**History:** ${history.length > 0 ? history.slice(-3).join(' → ') : 'No calculations yet'}`,
          UIUtils.colors.primary,
          'info',
          [
            {
              name: '📊 Memory',
              value: `**Stored:** ${memory}`,
              inline: true
            },
            {
              name: '🔢 Functions',
              value: 'Basic math, scientific functions, memory operations',
              inline: true
            }
          ],
          { text: 'Click buttons to calculate! 🎯' }
        );

        await interaction.editReply({ embeds: [updatedEmbed] });

        if (!buttonInteraction.replied) {
          await buttonInteraction.deferUpdate();
        }
      } catch (error) {
        const errorEmbed = UIUtils.createErrorEmbed(
          error,
          '❌ Calculation Error',
          [
            'Check your input syntax',
            'Make sure brackets are balanced',
            'Avoid division by zero'
          ]
        );
        await interaction.editReply({ embeds: [errorEmbed] });
        await buttonInteraction.deferUpdate();
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp('Calculator session timed out after 5 minutes.');
      }
    });
  },
};

function getSymbol(id) {
  switch (id) {
    case 'add':
      return '+';
    case 'subtract':
      return '-';
    case 'multiply':
      return '*';
    case 'divide':
      return '/';
    case 'pi':
      return Math.PI;
    case 'power':
      return '**';
    case 'sqrt':
      return 'Math.sqrt(';
    case 'sin':
      return 'Math.sin(';
    case 'cos':
      return 'Math.cos(';
    case 'factorial':
      return 'factorial(';
    case 'percent':
      return '/100';
    case 'open-bracket':
      return '(';
    case 'close-bracket':
      return ')';
    default:
      return null;
  }
}

function factorial(n) {
  if (n < 0) throw new Error('Factorial not defined for negative numbers');
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function evaluateExpression(input) {
  // Replace factorial function
  input = input.replace(/factorial\(([^)]+)\)/g, (match, num) => {
    return factorial(parseFloat(num));
  });

  // Replace scientific functions
  input = input.replace(/Math\.sqrt\(([^)]+)\)/g, (match, num) => {
    return Math.sqrt(parseFloat(num));
  });

  input = input.replace(/Math\.sin\(([^)]+)\)/g, (match, num) => {
    return Math.sin(parseFloat(num));
  });

  input = input.replace(/Math\.cos\(([^)]+)\)/g, (match, num) => {
    return Math.cos(parseFloat(num));
  });

  // Basic evaluation with error handling
  try {
    // Replace ** with Math.pow for better compatibility
    input = input.replace(/(\d+)\*\*(\d+)/g, 'Math.pow($1, $2)');
    
    // Use Function constructor for safer evaluation
    const result = new Function('Math', `return ${input}`)(Math);
    
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid calculation result');
    }
    
    return parseFloat(result.toFixed(8)); // Limit decimal places
  } catch (error) {
    throw new Error(`Invalid expression: ${error.message}`);
  }
}
