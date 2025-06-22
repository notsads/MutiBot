<div align="center">
  <img src="https://i.imgur.com/8tBXd6H.gif" alt="Lanya Bot" width="200"/>
  
  # 🤖 Lanya Bot
  
  **Advanced Discord Bot with 100+ Features & Beautiful UI**
  
  [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/kAYpdenZ8b)
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/birajrai/lanya)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  
  *An open-source Discord bot designed to enhance community interaction with a variety of engaging and useful features, featuring a beautiful web dashboard and modern UI.*
  
  **🎨 UI Enhanced by [notsads](https://github.com/notsads)**
</div>

---

## ✨ Features

### 🎨 **Beautiful Web Dashboard**
- **Real-time Statistics**: Live bot stats with beautiful animations
- **Modern UI**: Responsive design with glassmorphism effects
- **Interactive Elements**: Hover effects and smooth transitions
- **Mobile Friendly**: Optimized for all device sizes

### 🎵 **Advanced Music System**
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud, and more
- **High-Quality Audio**: Crystal clear sound with Lavalink
- **Queue Management**: Advanced queue controls and filters
- **Auto-Play**: Intelligent music recommendations

### 🛡️ **Comprehensive Moderation**
- **Auto-Moderation**: Smart content filtering and spam protection
- **Warning System**: Track and manage user warnings
- **Advanced Logging**: Detailed server activity logs
- **Role Management**: Automated role assignment and management

### 🎮 **Fun & Entertainment**
- **Interactive Games**: Trivia, WorldWar, and more
- **Meme Generator**: Create and share memes
- **Custom Welcome Cards**: Beautiful welcome images
- **Leveling System**: XP and rewards for active members

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
git clone https://github.com/birajrai/Lanya.git
cd Lanya
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Configuration**
```bash
npm run setup
```

4. **Start the Bot**
```bash
npm start
```

5. **Access Dashboard**
Open your browser and visit: `http://localhost:10000`

---

## 🎨 UI Enhancements

### **Modern Web Dashboard**
The bot now includes a beautiful web dashboard accessible at `http://localhost:10000` featuring:

- **Real-time Statistics**: Live updates of bot performance
- **Glassmorphism Design**: Modern glass-like UI elements
- **Responsive Layout**: Works perfectly on all devices
- **Interactive Cards**: Hover effects and animations
- **Professional Styling**: Clean, modern aesthetic

### **Enhanced Discord Embeds**
All bot responses now feature:

- **Consistent Color Scheme**: Beautiful gradient colors
- **Professional Icons**: Meaningful emojis and symbols
- **Better Typography**: Improved readability
- **Interactive Elements**: Buttons and dropdowns
- **Error Handling**: User-friendly error messages

### **Improved Console Output**
Enhanced terminal experience with:

- **Color-coded Messages**: Easy-to-read status updates
- **Progress Indicators**: Visual loading states
- **Structured Layout**: Organized information display
- **Success/Error States**: Clear status feedback

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

The bot includes a beautiful web dashboard accessible at `http://localhost:10000` that provides:

### **Real-time Statistics**
- Live server count
- User count updates
- Memory usage monitoring
- Uptime tracking

### **Feature Showcase**
- Interactive feature cards
- Detailed descriptions
- Visual icons and animations

### **Professional Design**
- Modern glassmorphism effects
- Responsive mobile design
- Smooth animations
- Professional color scheme

---

## 🛠️ Development

### **Adding New Commands**

1. Create a new command file in the appropriate category folder
2. Use the enhanced command template structure
3. Register the command in the command handler

Example command structure:

```javascript
module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description'),
  
  async execute(interaction) {
    // Enhanced embed creation
    const embed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('🎯 Command Title')
      .setDescription('Command description')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
```

### **UI Best Practices**

- Use consistent color schemes (defined in `utils/utils.js`)
- Include meaningful emojis and icons
- Provide clear error messages
- Use interactive components when appropriate
- Follow the established embed patterns

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our UI guidelines
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### **UI Contribution Guidelines**

- Follow the established color scheme and styling patterns
- Use the enhanced console utilities for logging
- Include proper error handling with user-friendly messages
- Test your changes on both desktop and mobile
- Ensure accessibility and readability

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

- [ ] **Enhanced Dashboard**: More interactive features and analytics
- [ ] **Advanced Auto-Moderation**: AI-powered content filtering
- [ ] **Custom Command Builder**: Visual command creation interface
- [ ] **Mobile App**: Native mobile application
- [ ] **Advanced Analytics**: Detailed server statistics
- [ ] **Plugin System**: Third-party plugin support
- [ ] **Voice Commands**: Voice-activated bot features

Have suggestions? Share them in our [Support Server](https://discord.gg/MBemErWj8p)!

---

<div align="center">
  <p>Modified By notsads </p>
  <p><strong>🎨 UI Enhanced by <a href="https://github.com/notsads">notsads</a></strong></p>
  
  [![Discord](https://img.shields.io/badge/Join%20Support%20Server-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/MBemErWj8p)
  [![GitHub](https://img.shields.io/badge/View%20on%20GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/birajrai/lanya)
</div>
