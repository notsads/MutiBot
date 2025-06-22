const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Todo = require('../../models/Todo');
const UIUtils = require('../../utils/uiUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('todo')
    .setDescription('Manage your todo list with beautiful UI.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a task to your todo list.')
        .addStringOption((option) =>
          option
            .setName('task')
            .setDescription('The task to add')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('priority')
            .setDescription('Set the priority level: low, medium, high')
            .setRequired(false)
            .addChoices(
              { name: '🟢 Low', value: 'low' },
              { name: '🟡 Medium', value: 'medium' },
              { name: '🔴 High', value: 'high' }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('view').setDescription('View your todo list.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a task from your todo list.')
        .addIntegerOption((option) =>
          option
            .setName('task_number')
            .setDescription('The task number to delete')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete_all')
        .setDescription('Delete all tasks from your todo list.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('complete')
        .setDescription('Mark a task as completed.')
        .addIntegerOption((option) =>
          option
            .setName('task_number')
            .setDescription('The task number to mark as completed')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('priority')
        .setDescription('Change the priority of a task.')
        .addIntegerOption((option) =>
          option
            .setName('task_number')
            .setDescription('The task number to change priority')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('new_priority')
            .setDescription('Set the new priority level: low, medium, high')
            .setRequired(true)
            .addChoices(
              { name: '🟢 Low', value: 'low' },
              { name: '🟡 Medium', value: 'medium' },
              { name: '🔴 High', value: 'high' }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === 'add') {
      const task = interaction.options.getString('task');
      const priority = interaction.options.getString('priority') || 'medium';

      const newTodo = new Todo({
        userId,
        task,
        priority,
        dateAdded: new Date(),
      });

      await newTodo.save();

      const priorityEmoji = this.getPriorityEmoji(priority);
      const progressBar = UIUtils.createProgressBar(1, 1, 15, false);

      const addEmbed = UIUtils.createSuccessEmbed(
        '📝 Task Added Successfully',
        `**${priorityEmoji} New Task:** ${task}\n\n**Priority:** ${priority.toUpperCase()}\n**Progress:** ${progressBar}`,
        [
          {
            name: '📋 Next Steps',
            value: 'Use `/todo view` to see all your tasks',
            inline: false
          }
        ],
        { text: 'Task added successfully! 🎉' }
      );

      await interaction.reply({ embeds: [addEmbed], ephemeral: true });
    } else if (subcommand === 'view') {
      const todos = await Todo.find({ userId }).sort({ priority: -1, dateAdded: -1 });

      if (todos.length === 0) {
        const emptyEmbed = UIUtils.createInfoEmbed(
          '📝 Todo List',
          'Your todo list is currently empty.\n\n**💡 Tip:** Use `/todo add` to add your first task!',
          [
            {
              name: '🚀 Getting Started',
              value: 'Start by adding a simple task to get organized!',
              inline: false
            }
          ]
        );

        return await interaction.reply({
          embeds: [emptyEmbed],
          ephemeral: true,
        });
      }

      const completedTasks = todos.filter(todo => todo.isCompleted).length;
      const totalTasks = todos.length;
      const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
      const progressBar = UIUtils.createProgressBar(completedTasks, totalTasks, 20, true);

      const tasks = todos
        .map((todo, index) => {
          const timestamp = Math.floor(
            new Date(todo.dateAdded).getTime() / 1000
          );
          const priorityEmoji = this.getPriorityEmoji(todo.priority);
          const statusEmoji = todo.isCompleted ? '✅' : '⏳';
          const statusText = todo.isCompleted ? 'Completed' : 'Pending';
          
          return `\`${index + 1}.\` **${todo.task}**\n    ${priorityEmoji} **Priority:** ${todo.priority.toUpperCase()}\n    ${statusEmoji} **Status:** ${statusText}\n    📅 **Added:** <t:${timestamp}:R>`;
        })
        .join('\n\n');

      const viewEmbed = UIUtils.createAnimatedEmbed(
        '📋 Your Todo List',
        `**Progress Overview:**\n${progressBar}\n**${completedTasks}/${totalTasks}** tasks completed (${progressPercentage}%)\n\n${tasks}`,
        UIUtils.colors.primary,
        'info',
        [
          {
            name: '📊 Statistics',
            value: `**Total Tasks:** ${totalTasks}\n**Completed:** ${completedTasks}\n**Pending:** ${totalTasks - completedTasks}`,
            inline: true
          },
          {
            name: '🎯 Quick Actions',
            value: 'Use `/todo complete [number]` to mark as done\nUse `/todo delete [number]` to remove tasks',
            inline: true
          }
        ],
        { text: 'Stay organized and productive! 💪' }
      );

      await interaction.reply({ embeds: [viewEmbed], ephemeral: true });
    } else if (subcommand === 'delete') {
      const taskNumber = interaction.options.getInteger('task_number') - 1;
      const todos = await Todo.find({ userId });

      if (taskNumber < 0 || taskNumber >= todos.length) {
        const errorEmbed = UIUtils.createErrorEmbed(
          new Error('Invalid task number'),
          '❌ Task Not Found',
          [
            'Check your task list with `/todo view`',
            'Make sure the task number is correct',
            'Task numbers start from 1'
          ]
        );

        return await interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }

      const removedTask = todos[taskNumber];
      await Todo.deleteOne({ _id: removedTask._id });

      const deleteEmbed = UIUtils.createSuccessEmbed(
        '🗑️ Task Deleted',
        `**Removed Task:** ${removedTask.task}\n\n**Priority:** ${this.getPriorityEmoji(removedTask.priority)} ${removedTask.priority.toUpperCase()}`,
        [
          {
            name: '📝 Remaining Tasks',
            value: `${todos.length - 1} tasks left in your list`,
            inline: true
          }
        ],
        { text: 'Task removed successfully! 🎯' }
      );

      await interaction.reply({ embeds: [deleteEmbed], ephemeral: true });
    } else if (subcommand === 'delete_all') {
      const todos = await Todo.find({ userId });
      const deleted = await Todo.deleteMany({ userId });

      const deleteAllEmbed = UIUtils.createWarningEmbed(
        '🗑️ All Tasks Deleted',
        deleted.deletedCount > 0
          ? `**${deleted.deletedCount}** tasks have been removed from your todo list.\n\n**💡 Fresh Start:** Your todo list is now clean and ready for new tasks!`
          : 'Your todo list was already empty.',
        [
          {
            name: '🔄 Next Steps',
            value: 'Use `/todo add` to start building your new todo list',
            inline: false
          }
        ],
        { text: 'Clean slate achieved! 🎉' }
      );

      await interaction.reply({
        embeds: [deleteAllEmbed],
        ephemeral: true,
      });
    } else if (subcommand === 'complete') {
      const taskNumber = interaction.options.getInteger('task_number') - 1;
      const todos = await Todo.find({ userId });

      if (taskNumber < 0 || taskNumber >= todos.length) {
        const errorEmbed = UIUtils.createErrorEmbed(
          new Error('Invalid task number'),
          '❌ Task Not Found',
          [
            'Check your task list with `/todo view`',
            'Make sure the task number is correct',
            'Task numbers start from 1'
          ]
        );

        return await interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }

      const taskToComplete = todos[taskNumber];
      
      if (taskToComplete.isCompleted) {
        const alreadyCompleteEmbed = UIUtils.createInfoEmbed(
          '✅ Already Completed',
          `**Task:** ${taskToComplete.task}\n\nThis task was already marked as completed!`,
          [
            {
              name: '🎯 Progress',
              value: 'Keep up the great work!',
              inline: false
            }
          ]
        );

        return await interaction.reply({
          embeds: [alreadyCompleteEmbed],
          ephemeral: true,
        });
      }

      taskToComplete.isCompleted = true;
      await taskToComplete.save();

      const completedTasks = todos.filter(todo => todo.isCompleted).length + 1;
      const totalTasks = todos.length;
      const progressBar = UIUtils.createProgressBar(completedTasks, totalTasks, 15, true);

      const completeEmbed = UIUtils.createSuccessEmbed(
        '🎉 Task Completed!',
        `**✅ Completed Task:** ${taskToComplete.task}\n\n**Progress:** ${progressBar}\n**${completedTasks}/${totalTasks}** tasks completed`,
        [
          {
            name: '🏆 Achievement',
            value: 'Great job! You\'re making progress!',
            inline: true
          },
          {
            name: '📈 Next Goal',
            value: `${totalTasks - completedTasks} tasks remaining`,
            inline: true
          }
        ],
        { text: 'Keep up the momentum! 💪' }
      );

      await interaction.reply({
        embeds: [completeEmbed],
        ephemeral: true,
      });
    } else if (subcommand === 'priority') {
      const taskNumber = interaction.options.getInteger('task_number') - 1;
      const newPriority = interaction.options.getString('new_priority');
      const todos = await Todo.find({ userId });

      if (taskNumber < 0 || taskNumber >= todos.length) {
        const errorEmbed = UIUtils.createErrorEmbed(
          new Error('Invalid task number'),
          '❌ Task Not Found',
          [
            'Check your task list with `/todo view`',
            'Make sure the task number is correct',
            'Task numbers start from 1'
          ]
        );

        return await interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }

      const taskToChange = todos[taskNumber];
      const oldPriority = taskToChange.priority;
      taskToChange.priority = newPriority;
      await taskToChange.save();

      const priorityChangeEmbed = UIUtils.createAnimatedEmbed(
        '🔄 Priority Updated',
        `**Task:** ${taskToChange.task}\n\n**Priority Change:**\n${this.getPriorityEmoji(oldPriority)} ${oldPriority.toUpperCase()} → ${this.getPriorityEmoji(newPriority)} ${newPriority.toUpperCase()}`,
        UIUtils.colors.warning,
        'info',
        [
          {
            name: '📋 Task Details',
            value: `**Number:** ${taskNumber + 1}\n**Status:** ${taskToChange.isCompleted ? '✅ Completed' : '⏳ Pending'}`,
            inline: true
          },
          {
            name: '💡 Tip',
            value: 'Use `/todo view` to see your updated list',
            inline: true
          }
        ],
        { text: 'Priority updated successfully! 🎯' }
      );

      await interaction.reply({
        embeds: [priorityChangeEmbed],
        ephemeral: true,
      });
    }
  },

  getPriorityEmoji(priority) {
    const emojis = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };
    return emojis[priority] || '🟡';
  }
};
