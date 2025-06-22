<div align="center">
  <img src="https://i.imgur.com/8tBXd6H.gif" alt="Lanya Bot" width="200"/>
  
  # 🤖 Lanya Bot
  
  **Advanced Discord Bot with 100+ Features & Beautiful UI**
  
  [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/kAYpdenZ8b)
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/notsads/Multi01)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  
  *An open-source Discord bot designed to enhance community interaction with a variety of engaging and useful features, featuring a beautiful web dashboard and modern UI.*
  
  **🎨 UI Enhanced by [notsads](https://github.com/notsads)**
</div>

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation & Setup](#-installation--setup)
- [UI/UX Enhancements](#-uiux-enhancements)
- [Command Categories](#-command-categories)
- [Web Dashboard](#-web-dashboard)
- [Bug Fixes & Improvements](#-bug-fixes--improvements)
- [Technical Improvements](#-technical-improvements)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This document outlines the Lanya Discord bot - a professional, feature-rich application with a beautiful web dashboard and enhanced user experience. The bot has been transformed from a basic Discord bot into an enterprise-level application with comprehensive features and modern UI/UX.

### 🎨 **UI Enhanced by [notsads](https://github.com/notsads)**

---

## ✨ Features

### 🎨 **Beautiful Web Dashboard**
- **Real-time Statistics**: Live bot stats with beautiful animations
- **Modern UI**: Responsive design with glassmorphism effects
- **Interactive Elements**: Hover effects and smooth transitions
- **Mobile Friendly**: Optimized for all device sizes
- **Professional Design**: Clean, modern aesthetic with consistent theming

### 🎵 **Advanced Music System**
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud, and more
- **High-Quality Audio**: Crystal clear sound with Lavalink
- **Queue Management**: Advanced queue controls and filters
- **Auto-Play**: Intelligent music recommendations
- **Enhanced UI**: Animated loading and processing embeds

### 🛡️ **Comprehensive Moderation**
- **Auto-Moderation**: Smart content filtering and spam protection
- **Warning System**: Track and manage user warnings
- **Advanced Logging**: Detailed server activity logs
- **Role Management**: Automated role assignment and management
- **Permission Validation**: Role hierarchy checks and confirmation dialogs

### 🎮 **Fun & Entertainment**
- **Interactive Games**: Trivia, WorldWar, and more
- **Meme Generator**: Create and share memes
- **Custom Welcome Cards**: Beautiful welcome images
- **Leveling System**: XP and rewards for active members
- **Enhanced Responses**: Categorized responses with confidence indicators

### 🎫 **Professional Ticket System**
- **Category Management**: Organize support requests
- **Transcript Generation**: Detailed conversation logs
- **Custom Panels**: Beautiful ticket creation interfaces
- **Auto-Close**: Intelligent ticket management

### 🟩 **Minecraft Integration**
- **Server Status**: Real-time Minecraft server monitoring
- **Player Statistics**: View player skins and stats
- **Server Management**: Add/remove server monitoring
- **Status Updates**: Automatic status notifications

### 🔧 **Advanced Utility Commands**
- **Scientific Calculator**: Advanced mathematical functions
- **Weather System**: 3-day forecast with air quality
- **Translator**: 24 language support with auto-detection
- **Todo System**: Priority-based task management
- **Backup System**: Complete server settings backup

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- [MongoDB](https://www.mongodb.com/) database
- [Discord Bot Token](https://discord.com/developers/applications)
- Weather API key (for weather commands)

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/notsads/Multi01.git
cd Multi01
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the Bot**
```bash
npm start
```

5. **Access Dashboard**
Open your browser and visit: `http://localhost:10000`

---

## 🎨 UI/UX Enhancements

### **UI Utilities System** (`utils/uiUtils.js`)
Created a comprehensive UI utilities system for consistent theming:

#### **Color System**
```javascript
static colors = {
  success: 0x4CAF50,    // Green
  error: 0xFF6B6B,      // Red
  warning: 0xFF9800,    // Orange
  info: 0x2196F3,       // Blue
  primary: 0x4ECDC4,    // Teal
  secondary: 0x607D8B,  // Blue Grey
  purple: 0x9C27B0,     // Purple
  gold: 0xFFD700,       // Gold
  silver: 0xC0C0C0,     // Silver
  bronze: 0xCD7F32      // Bronze
};
```

#### **Utility Functions**
- **Progress Bars**: `createProgressBar(current, total, width, showPercentage)`
- **Loading Spinners**: `getLoadingSpinner()`
- **Status Indicators**: `getStatusIndicator(status)`
- **Animated Embeds**: `createAnimatedEmbed(title, description, color, status, fields, footer, thumbnail)`
- **Rich Embeds**: Success, Error, Info, Warning embeds
- **Confirmation Dialogs**: `createConfirmationDialog(title, description, confirmLabel, cancelLabel)`
- **Pagination Controls**: `createPaginationControls(currentPage, totalPages, customIds)`
- **Action Buttons**: `createActionButtons(actions, style)`

### **Enhanced Commands**

#### **1. Help Command** (`commands/info/help.js`)
- **Animated embeds** with loading states
- **Category browsing** with pagination
- **Fuzzy search** with Fuse.js
- **Detailed command information**
- **Quick action buttons**
- **Interactive navigation**

#### **2. Ping Command** (`commands/info/ping.js`)
- **Animated latency embeds**
- **Progress bars** for latency visualization
- **Detailed performance metrics**
- **Interactive refresh buttons**
- **Historical data tracking**
- **Performance analysis**

#### **3. Server Info Command** (`commands/info/serverinfo.js`)
- **Multi-page information display**
- **Progress bars** for member activity
- **Boost progress visualization**
- **Interactive navigation buttons**
- **Detailed statistics**
- **Real-time data updates**

#### **4. 8ball Command** (`commands/fun/8ball.js`)
- **Categorized responses** (positive, negative, neutral)
- **Confidence bars** with progress visualization
- **Mystical insights** and detailed readings
- **Interactive buttons** for re-asking and history
- **Animated embeds** with status indicators

#### **5. Ban Command** (`commands/moderation/ban.js`)
- **Permission validation** and role hierarchy checks
- **Detailed confirmation dialogs**
- **Animated processing** and success embeds
- **Action buttons** for unban and audit log
- **Temporary ban handling** with notifications

#### **6. Play Command** (`commands/music/play.js`)
- **Animated loading** and processing embeds
- **Detailed track information** with progress bars
- **Interactive buttons** for queue and now playing
- **Error handling** with rich embeds
- **Playlist support** with detailed statistics

---

## 🔧 Command Improvements

### **Todo Command** (`commands/utility/todo.js`)
#### **Enhanced Features**
- **Priority system** with emoji indicators (🟢 Low, 🟡 Medium, 🔴 High)
- **Progress tracking** with completion percentages
- **Smart sorting** (priority + date)
- **Achievement system** for completed tasks
- **Rich error handling** with helpful suggestions
- **Statistics display** with progress bars

#### **New Subcommands**
- `/todo add` - Add tasks with priority levels
- `/todo view` - View tasks with progress tracking
- `/todo complete` - Mark tasks as completed
- `/todo delete` - Remove individual tasks
- `/todo delete_all` - Clear all tasks
- `/todo priority` - Change task priority

### **Calculator Command** (`commands/utility/calculator.js`)
#### **Scientific Features**
- **Advanced mathematical functions** (sin, cos, sqrt, factorial)
- **Memory system** for storing values
- **Calculation history** (last 10 calculations)
- **Enhanced button layout** with emojis
- **Safer evaluation** with error handling
- **Session timeout** (5 minutes)

#### **New Functions**
- Trigonometric functions (sin, cos)
- Square root and power functions
- Factorial calculations
- Memory operations
- History management

### **Weather Command** (`commands/utility/weather.js`)
#### **Comprehensive Weather Data**
- **Temperature unit conversion** (Celsius/Fahrenheit)
- **3-day forecast** integration
- **Air quality information**
- **Dynamic weather emojis** based on conditions
- **Color-coded embeds** based on weather type
- **Interactive buttons** for refresh and unit toggle

#### **Enhanced Data**
- Current conditions with feels-like temperature
- Wind speed and direction
- Humidity and dew point
- Visibility and UV index
- Pressure measurements
- Air quality index

### **Translator Command** (`commands/utility/translator.js`)
#### **24 Language Support**
- **Auto-language detection**
- **Source language specification**
- **Translation confidence indicators**
- **Character count tracking**
- **Interactive buttons** for reverse translation
- **Flag emojis** for visual language identification

#### **Supported Languages**
- **European**: Spanish, French, German, Italian, Portuguese, Russian, Dutch, Swedish, Norwegian, Danish, Finnish, Polish, Czech, Hungarian, Romanian, Greek
- **Asian**: Japanese, Korean, Chinese (Simplified/Traditional), Arabic, Hindi, Turkish, Thai, Vietnamese

---

## 📚 Command Categories

<details>
<summary>🎵 <strong>Music Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/play`        | Play music from various sources        |
| `/search`      | Search and select music tracks         |
| `/queue`       | View and manage the music queue        |
| `/nowplaying`  | Display currently playing track        |
| `/controls`    | Music player controls                  |
| `/filters`     | Apply audio filters                    |
| `/lyrics`      | Get song lyrics                        |
| `/playlist`    | Manage playlists                       |
| `/autoplay`    | Enable/disable autoplay                |
| `/loop`        | Set loop mode                          |

</details>

<details>
<summary>🛡️ <strong>Moderation Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/ban`         | Ban a user from the server             |
| `/kick`        | Kick a user from the server            |
| `/timeout`     | Timeout a user                         |
| `/warn`        | Warn a user                            |
| `/warnings`    | View user warnings                     |
| `/clear`       | Clear messages from a channel          |
| `/lock`        | Lock a channel                         |
| `/unlock`      | Unlock a channel                       |
| `/nick`        | Change user nickname                   |
| `/nuke`        | Delete and recreate a channel          |

</details>

<details>
<summary>🎮 <strong>Fun Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/trivia`      | Play trivia game                       |
| `/meme`        | Get random memes                       |
| `/joke`        | Tell a joke                            |
| `/8ball`       | Ask the magic 8-ball                   |
| `/coinflip`    | Flip a coin                            |
| `/randomnumber`| Generate random number                 |
| `/dadjoke`     | Get a dad joke                         |
| `/catfact`     | Get random cat facts                   |
| `/dogfact`     | Get random dog facts                   |
| `/WorldWar`    | Play WorldWar game                     |
| `/GuessNumber` | Number guessing game                   |
| `/pp`          | Measure pp size (fun)                  |

</details>

<details>
<summary>⚙️ <strong>Administration Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/autorole`    | Set automatic role assignment           |
| `/buttonrole`  | Create button role panels              |
| `/giveaway`    | Start and manage giveaways             |
| `/guildsettings`| Configure guild settings              |
| `/leveladmin`  | Manage leveling system                 |
| `/serverlogs`  | Configure server logging               |
| `/welcome`     | Set up welcome system                  |

</details>

<details>
<summary>🎫 <strong>Ticket Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/setup`       | Setup ticket system                    |
| `/create-panel`| Create ticket panel                    |
| `/manage-categories`| Manage ticket categories          |
| `/ticket`      | Ticket management commands             |

</details>

<details>
<summary>🛠️ <strong>Utility Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/calculator`  | Scientific calculator                  |
| `/define`      | Define words                           |
| `/embedbuilder`| Create custom embeds                   |
| `/todo`        | Manage todo list                       |
| `/translator`  | Translate text                         |
| `/weather`     | Get weather information                |
| `/backup`      | Create server backup                   |
| `/automod`     | Configure auto-moderation              |

</details>

<details>
<summary>🟩 <strong>Minecraft Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/addserverstatus` | Add Minecraft server monitoring |
| `/removeserverstatus` | Stop monitoring a server     |
| `/serverstatus`       | Check server status         |
| `/skin`               | View player skin            |
| `/headavatar`         | Get player head avatar      |
| `/fullbody`           | Get full player body        |
| `/bodyavatar`         | Get player body avatar      |
| `/playerhead`         | Get player head             |
| `/achievement`        | Create achievement image    |
| `/listservers`        | List monitored servers      |

</details>

<details>
<summary>📊 <strong>Level Commands</strong></summary>
<br>

| Command        | Description                            |
| ---------------| -------------------------------------- |
| `/level`       | Check your current level and XP        |
| `/leaderboard` | View the server's level leaderboard    |

</details>

---

## 🌐 Web Dashboard

### **Enhanced Server** (`lanya.js`)
#### **API Endpoints**
- **Health Check**: `/api/health`
- **Bot Statistics**: `/api/stats`
- **Commands List**: `/api/commands`
- **Servers Information**: `/api/servers`
- **Analytics Data**: `/api/analytics`
- **Bot Information**: `/api/botinfo`
- **System Status**: `/api/status`

#### **Server Features**
- **CORS Support** for cross-origin requests
- **Error Handling** middleware
- **JSON Parsing** for API requests
- **404 Error Handling**
- **Environment Variable** support
- **Real-time Data** updates

### **Frontend Enhancements** (`public/index.html`)
#### **Real-time Updates**
- **5-second stats updates**
- **10-second bot info updates**
- **30-second server list updates**
- **15-second health checks**

#### **Interactive Features**
- **Command search** with fuzzy matching
- **Tab navigation** with smooth transitions
- **Charts and analytics** with Chart.js
- **Responsive design** for all devices
- **Loading states** and error handling

#### **Visual Improvements**
- **Glassmorphism design** with backdrop blur
- **Animated elements** and transitions
- **Professional color scheme**
- **Modern typography** with Inter font
- **Icon integration** with Font Awesome

---

## 🐛 Bug Fixes & Improvements

### **Critical Fixes**
1. **8ball Command Syntax Error**
   - **Issue**: Duplicate `response` variable declaration
   - **Fix**: Renamed Discord message response to `messageResponse`
   - **File**: `commands/fun/8ball.js`

2. **Todo Command Syntax Error**
   - **Issue**: Extra opening brace in priority subcommand
   - **Fix**: Removed duplicate brace and fixed syntax
   - **File**: `commands/utility/todo.js`

3. **Translator Command Choice Limit**
   - **Issue**: 57 language choices exceeded Discord's 25 limit
   - **Fix**: Reduced to 24 most popular languages
   - **File**: `commands/utility/translator.js`

### **Database & Connection Fixes**
1. **Backup System Integration**
   - **Issue**: Empty Backup model causing `countDocuments` errors
   - **Fix**: Complete Mongoose schema implementation
   - **File**: `models/Backup.js`

2. **Database Initialization**
   - **Issue**: Missing database connection in bot startup
   - **Fix**: Added proper MongoDB initialization
   - **File**: `events/client/ready.js`

---

## ⚡ Technical Improvements

### **Event Enhancements**

#### **Ready Event** (`events/client/ready.js`)
- **Animated startup logs** with chalk colors
- **Detailed statistics** with progress bars
- **Feature status logging**
- **Periodic performance logging**
- **Database initialization**

#### **Interaction Create Event** (`events/client/interactionCreate.js`)
- **Detailed command usage** tracking
- **Performance metrics** collection
- **Enhanced error embeds**
- **Analytics logging** for commands, buttons, select menus
- **Error recovery** mechanisms

### **Canvas Utilities** (`utils/canvasUtils.js`)
- **Font fallback system** for better compatibility
- **Error handling** in avatar loading
- **Placeholder avatars** when loading fails
- **Modern text styling** with shadows and gradients
- **Performance optimizations**

### **New Features**
- **Backup System**: Complete backup creation with JSZip
- **Testing Tools**: Server test script (`test-server.js`)
- **Enhanced Error Handling**: User-friendly error messages
- **Monitoring System**: Real-time performance tracking

---

## 📚 API Documentation

### **Health Check**
```http
GET /api/health
```
Returns system health status including bot status, uptime, and service connections.

### **Bot Statistics**
```http
GET /api/stats
```
Returns real-time bot statistics including server count, user count, uptime, and memory usage.

### **Commands List**
```http
GET /api/commands
```
Returns list of all available bot commands with descriptions and categories.

### **Servers Information**
```http
GET /api/servers
```
Returns detailed information about all servers the bot is in.

### **Analytics Data**
```http
GET /api/analytics
```
Returns performance and usage analytics data.

### **Bot Information**
```http
GET /api/botinfo
```
Returns comprehensive bot information including version, platform, and status.

### **System Status**
```http
GET /api/status
```
Returns detailed system status including bot, system, and services information.

### **API Usage Example**
```javascript
// Example: Fetch bot statistics
const response = await fetch('http://localhost:10000/api/stats');
const stats = await response.json();
console.log(stats);
```

---

## 🛠️ Development

### **Adding New Commands**

1. Create a new command file in the appropriate category folder
2. Use the enhanced command template structure
3. Register the command in the command handler

Example command structure:

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UIUtils } = require('../../utils/uiUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description'),
  
  async execute(interaction) {
    // Enhanced embed creation using UI utilities
    const embed = UIUtils.createSuccessEmbed(
      '🎯 Command Title',
      'Command description with enhanced styling'
    );
    
    await interaction.reply({ embeds: [embed] });
  },
};
```

### **UI Best Practices**

- Use consistent color schemes from `utils/uiUtils.js`
- Include meaningful emojis and icons
- Provide clear error messages with troubleshooting suggestions
- Use interactive components when appropriate
- Follow the established embed patterns
- Include loading states for better UX

### **Testing**
Run the server test script to verify functionality:
```bash
node test-server.js
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our UI guidelines
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### **Development Guidelines**
1. **Follow the UI theme** using `utils/uiUtils.js`
2. **Add proper error handling** with user-friendly messages
3. **Include loading states** for better UX
4. **Test all features** before submitting
5. **Update documentation** for new features

### **Code Style**
- Use consistent color schemes from UI utilities
- Include meaningful emojis and icons
- Provide clear error messages
- Use interactive components when appropriate
- Follow established embed patterns

---

## 📜 Code of Conduct

We strive to maintain a friendly, inclusive, and respectful community:

- **Be Respectful**: Treat others with respect and kindness
- **Be Inclusive**: Welcome contributions from everyone
- **Be Supportive**: Help others and be open to feedback
- **Be Professional**: Maintain high code quality and documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🚀 Roadmap

- [x] **Enhanced Dashboard**: More interactive features and analytics
- [x] **Advanced Auto-Moderation**: Smart content filtering
- [ ] **Custom Command Builder**: Visual command creation interface
- [ ] **Mobile App**: Native mobile application
- [x] **Advanced Analytics**: Detailed server statistics
- [ ] **Plugin System**: Third-party plugin support
- [ ] **Voice Commands**: Voice-activated bot features

Have suggestions? Share them in our [Support Server](https://discord.gg/kAYpdenZ8b)!

---

## 🎉 Summary

The Lanya bot has been transformed into a professional, feature-rich Discord bot with:

- ✅ **100+ Enhanced Commands** with beautiful UI
- ✅ **Professional Web Dashboard** with real-time monitoring
- ✅ **Comprehensive Error Handling** and user feedback
- ✅ **Modern UI/UX** with animations and interactions
- ✅ **Robust API System** with full documentation
- ✅ **Testing Tools** and development utilities
- ✅ **Production-Ready** code with best practices

### **Key Achievements**
- 🎨 **Consistent UI/UX** across all commands
- 🚀 **Performance Optimizations** and error handling
- 📊 **Real-time Monitoring** and analytics
- 🔧 **Developer-Friendly** codebase with utilities
- 🌐 **Professional Web Dashboard** with API
- 🐛 **Comprehensive Bug Fixes** and improvements

The bot is now ready for production use with enterprise-level features and professional-grade user experience! 🎯

---

<div align="center">
  <p>Made with ❤️ by the Lanya Development Team</p>
  <p><strong>🎨 UI Enhanced by <a href="https://github.com/notsads">notsads</a></strong></p>
  <p><strong>🚀 Developed by <a href="https://github.com/birajrai">birajrai</a></strong></p>
  
  [![Discord](https://img.shields.io/badge/Join%20Support%20Server-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/kAYpdenZ8b)
  [![GitHub](https://img.shields.io/badge/View%20on%20GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/notsads/Multi01)
</div>
