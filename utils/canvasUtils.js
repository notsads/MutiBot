const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Register custom fonts
try {
  registerFont(path.join(__dirname, 'Poppins-Medium.ttf'), { family: 'Poppins-Bold' });
  registerFont(path.join(__dirname, 'Poppins-Regular.ttf'), { family: 'Poppins-Regular' });
  registerFont(path.join(__dirname, 'BrunoAce-Regular.ttf'), { family: 'BrunoAce' });
} catch (error) {
  console.log('Custom fonts not found, using system fonts');
}

class CanvasUtils {
  // Create linear gradient
  static createGradient(ctx, x0, y0, x1, y1, colors) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
  }

  // Create radial gradient
  static createRadialGradient(ctx, x0, y0, r0, x1, y1, r1, colors) {
    const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
  }

  // Create beautiful background
  static createBackground(ctx, width, height, type = 'gradient') {
    if (type === 'gradient') {
      const backgroundGradient = this.createGradient(ctx, 0, 0, 0, height, [
        '#667eea',
        '#764ba2',
        '#f093fb',
        '#f5576c'
      ]);
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'solid') {
      ctx.fillStyle = '#2c2f33';
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Add particle effects
  static addParticles(ctx, width, height, count = 30, opacity = 0.5) {
    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 3 + 1;
      const particleOpacity = Math.random() * opacity + 0.1;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // Add geometric shapes
  static addGeometricShapes(ctx, width, height, opacity = 0.1) {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Large circle
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 200, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Small circles
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 50 + 20;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw circular avatar with effects
  static async drawAvatar(ctx, avatarUrl, x, y, radius) {
    try {
      const avatar = await loadImage(avatarUrl);
      
      // Create avatar background with gradient
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 15, 0, Math.PI * 2, true);
      const avatarBgGradient = this.createRadialGradient(
        ctx, x, y, 0, x, y, radius + 15,
        ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)']
      );
      ctx.fillStyle = avatarBgGradient;
      ctx.fill();
      ctx.restore();

      // Add avatar border with gradient
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 8, 0, Math.PI * 2, true);
      const borderGradient = this.createGradient(
        ctx, x - radius, y - radius, x + radius, y + radius,
        ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
      );
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 16;
      ctx.stroke();
      ctx.restore();

      // Clip and draw avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatar,
        x - radius,
        y - radius,
        radius * 2,
        radius * 2
      );
      ctx.restore();

      // Add inner avatar border
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius - 4, 0, Math.PI * 2, true);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();
    } catch (error) {
      console.warn(`Failed to load avatar from ${avatarUrl}: ${error.message}`);
      
      // Draw a placeholder avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 15, 0, Math.PI * 2, true);
      const avatarBgGradient = this.createRadialGradient(
        ctx, x, y, 0, x, y, radius + 15,
        ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)']
      );
      ctx.fillStyle = avatarBgGradient;
      ctx.fill();
      ctx.restore();

      // Draw placeholder circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.fillStyle = '#7289da';
      ctx.fill();
      ctx.restore();

      // Add border
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius - 4, 0, Math.PI * 2, true);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // Draw user icon
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `${radius * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('��', x, y);
      ctx.restore();
    }
  }

  // Draw text with modern styling
  static drawText(ctx, text, x, y, options = {}) {
    const {
      font = 'bold 60px Poppins-Bold',
      color = '#ffffff',
      align = 'center',
      shadow = true,
      gradient = null
    } = options;

    ctx.save();
    
    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Improved font fallback system
    let fontToUse = font;
    try {
      ctx.font = font;
      // Test if font loaded by trying to measure text
      ctx.measureText('Test');
    } catch (error) {
      // Fallback to system fonts if custom fonts fail
      fontToUse = font
        .replace('Poppins-Bold', 'Arial')
        .replace('Poppins-Regular', 'Arial')
        .replace('BrunoAce', 'Arial');
      ctx.font = fontToUse;
    }

    ctx.textAlign = align;
    
    if (gradient) {
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = color;
    }
    
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Draw progress bar
  static drawProgressBar(ctx, x, y, width, height, progress, options = {}) {
    const {
      bgColor = 'rgba(255, 255, 255, 0.2)',
      gradient = null,
      borderColor = 'rgba(255, 255, 255, 0.3)',
      borderRadius = 10
    } = options;

    // Background bar
    ctx.save();
    ctx.fillStyle = bgColor;
    this.roundRect(ctx, x, y, width, height, borderRadius);
    ctx.fill();
    ctx.restore();

    // Progress bar
    ctx.save();
    const progressWidth = (progress / 100) * width;
    
    if (gradient) {
      ctx.fillStyle = gradient;
    } else {
      const progressGradient = this.createGradient(
        ctx, x, y, x + progressWidth, y,
        ['#4ecdc4', '#45b7d1', '#96ceb4']
      );
      ctx.fillStyle = progressGradient;
    }
    
    this.roundRect(ctx, x, y, progressWidth, height, borderRadius);
    ctx.fill();
    ctx.restore();

    // Border
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, height, borderRadius);
    ctx.stroke();
    ctx.restore();
  }

  // Helper function for rounded rectangles
  static roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Add sparkles around a point
  static addSparkles(ctx, x, y, radius, count = 8, opacity = 0.3) {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const sparkleX = x + Math.cos(angle) * radius;
      const sparkleY = y + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }

  // Create welcome card
  static async createWelcomeCard(member, guild) {
    const canvas = createCanvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    // Create background
    this.createBackground(ctx, canvas.width, canvas.height);
    this.addParticles(ctx, canvas.width, canvas.height, 50);
    this.addGeometricShapes(ctx, canvas.width, canvas.height);

    // Draw avatar
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.4;
    const radius = 180;
    
    await this.drawAvatar(ctx, member.user.displayAvatarURL({ extension: 'png', size: 512 }), centerX, centerY, radius);

    // Member info
    const memberCount = guild.memberCount;
    const ordinalSuffix = this.getOrdinalSuffix(memberCount);

    // Draw welcome text
    this.drawText(ctx, 'WELCOME', canvas.width / 2, canvas.height * 0.65, {
      font: 'bold 120px Poppins-Bold',
      gradient: this.createGradient(
        ctx, canvas.width * 0.2, canvas.height * 0.65, canvas.width * 0.8, canvas.height * 0.65,
        ['#ffffff', '#f8f9fa', '#e9ecef']
      )
    });

    // Draw username
    this.drawText(ctx, member.user.username, canvas.width / 2, canvas.height * 0.75, {
      font: 'bold 80px Poppins-Bold',
      gradient: this.createGradient(
        ctx, canvas.width * 0.2, canvas.height * 0.75, canvas.width * 0.8, canvas.height * 0.75,
        ['#ff6b6b', '#4ecdc4', '#45b7d1']
      )
    });

    // Draw member count
    this.drawText(ctx, `You are our ${memberCount}${ordinalSuffix} Member!`, canvas.width / 2, canvas.height * 0.85, {
      font: '60px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.9)'
    });

    // Draw server name
    this.drawText(ctx, `to ${guild.name}`, canvas.width / 2, canvas.height * 0.92, {
      font: '40px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.7)'
    });

    // Add sparkles
    this.addSparkles(ctx, centerX, centerY, radius + 50, 12);

    // Add timestamp
    this.drawText(ctx, new Date().toLocaleDateString(), canvas.width - 30, canvas.height - 30, {
      font: '24px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.5)',
      align: 'right'
    });

    return canvas;
  }

  // Create level-up card
  static async createLevelUpCard(user, level, xp, totalXp, guild) {
    const canvas = createCanvas(1200, 400);
    const ctx = canvas.getContext('2d');

    // Create background
    this.createBackground(ctx, canvas.width, canvas.height);
    this.addParticles(ctx, canvas.width, canvas.height, 30);
    this.addGeometricShapes(ctx, canvas.width, canvas.height, 0.1);

    // Draw avatar
    const avatarX = 80;
    const avatarY = canvas.height / 2;
    const avatarRadius = 80;
    
    await this.drawAvatar(ctx, user.displayAvatarURL({ extension: 'png', size: 256 }), avatarX, avatarY, avatarRadius);

    // Calculate XP for next level
    const xpForNextLevel = level * 100;
    const progress = (xp / xpForNextLevel) * 100;

    // Draw level-up text
    this.drawText(ctx, 'LEVEL UP!', 200, 120, {
      font: 'bold 60px Poppins-Bold',
      gradient: this.createGradient(ctx, 200, 100, 600, 100, ['#ffffff', '#f8f9fa', '#e9ecef']),
      align: 'left'
    });

    // Draw username
    this.drawText(ctx, user.username, 200, 160, {
      font: 'bold 40px Poppins-Bold',
      gradient: this.createGradient(ctx, 200, 160, 600, 160, ['#ff6b6b', '#4ecdc4', '#45b7d1']),
      align: 'left'
    });

    // Draw level
    this.drawText(ctx, `Level ${level}`, 200, 220, {
      font: 'bold 50px Poppins-Bold',
      color: 'rgba(255, 255, 255, 0.9)',
      align: 'left'
    });

    // Draw progress bar
    this.drawProgressBar(ctx, 200, 250, 400, 20, progress);

    // Draw progress text
    this.drawText(ctx, `${xp}/${xpForNextLevel} XP (${progress.toFixed(1)}%)`, 200, 290, {
      font: '20px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.8)',
      align: 'left'
    });

    // Draw total XP
    this.drawText(ctx, `Total XP: ${totalXp.toLocaleString()}`, 200, 310, {
      font: '16px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.6)',
      align: 'left'
    });

    // Draw server name
    this.drawText(ctx, guild.name, canvas.width - 30, canvas.height - 30, {
      font: '18px Poppins-Regular',
      color: 'rgba(255, 255, 255, 0.7)',
      align: 'right'
    });

    // Add sparkles
    this.addSparkles(ctx, avatarX, avatarY, avatarRadius + 30, 8);

    return canvas;
  }

  // Get ordinal suffix
  static getOrdinalSuffix(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
    switch (lastDigit) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}

module.exports = CanvasUtils; 