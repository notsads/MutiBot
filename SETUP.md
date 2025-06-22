# Lanya Bot Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lanya

# Lavalink Configuration (Optional - for music features)
LL_PASSWORD=your_lavalink_password_here
LL_HOST=localhost
LL_PORT=2333
LL_NAME=main
```

## Required Setup

1. **Discord Bot Token**: Get this from the [Discord Developer Portal](https://discord.com/developers/applications)
2. **MongoDB**: Install MongoDB locally or use MongoDB Atlas
   - Local: `mongodb://localhost:27017/lanya`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/lanya?retryWrites=true&w=majority`

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file with the required variables

3. Start the bot:
   ```bash
   npm start
   ```

## Features Fixed

- ✅ Backup system now properly connected to MongoDB
- ✅ Database initialization added to bot startup
- ✅ Backup model schema created with proper indexing
- ✅ All required dependencies are installed

The backup command should now work properly with the `/backup create` command! 