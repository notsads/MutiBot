const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  backupId: {
    type: String,
    required: true,
    unique: true
  },
  guildId: {
    type: String,
    required: true,
    index: true
  },
  guildName: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['full', 'settings', 'roles', 'channels', 'custom']
  },
  description: {
    type: String,
    default: 'No description provided'
  },
  createdAt: {
    type: Number,
    required: true,
    default: Date.now
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
backupSchema.index({ guildId: 1, userId: 1 });
backupSchema.index({ guildId: 1, createdAt: -1 });

module.exports = mongoose.model('Backup', backupSchema); 