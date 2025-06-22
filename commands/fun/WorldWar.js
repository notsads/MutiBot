const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');
const WorldWar = require('../../models/WorldWar');
const path = require('path');
const Canvas = require('canvas');
const sharp = require('sharp');
const fetch = require('node-fetch');

// Helper function to create placeholder avatar
async function createPlaceholderAvatar(size = 256) {
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#7289da';
  ctx.fill();
  
  // Draw user icon
  ctx.fillStyle = '#ffffff';
  ctx.font = `${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👤', size / 2, size / 2);
  
  return canvas;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('worldwar')
    .setDescription('Manage the WorldWar game')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Setup the WorldWar game')
        .addIntegerOption((option) =>
          option
            .setName('min_participants')
            .setDescription('Minimum participants')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('max_participants')
            .setDescription('Maximum participants')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('start').setDescription('Start the WorldWar game.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('cancel')
        .setDescription('Cancel the active WorldWar game.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('stop')
        .setDescription('Stop the current WorldWar game early.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      await setupGame(interaction);
    } else if (subcommand === 'start') {
      await startGame(interaction);
    } else if (subcommand === 'cancel') {
      await cancelGame(interaction);
    } else if (subcommand === 'stop') {
      await stopGame(interaction);
    }
  },
};

async function setupGame(interaction) {
  if (!interaction.member.permissions.has('ManageServer')) {
    return interaction.reply({
      content:
        'You do not have `ManageServer` permission to manage worldwar game',
      ephemeral: true,
    });
  }
  const min = interaction.options.getInteger('min_participants');
  const max = interaction.options.getInteger('max_participants');

  if (min < 2)
    return interaction.reply('Minimum participants must be at least 2.');
  if (max <= min)
    return interaction.reply(
      'Maximum participants must be greater than minimum participants.'
    );

  let warNumber;
  try {
    const count = await WorldWar.countDocuments();
    warNumber = count + 1;
  } catch (error) {
    console.error('Error counting documents:', error);
    warNumber = 1;
  }

  const newGame = new WorldWar({
    warNumber,
    minParticipants: min,
    maxParticipants: max,
    participants: [],
    status: 'active',
  });

  try {
    await newGame.save();
  } catch (error) {
    console.error('Error saving game to database:', error);
    return interaction.reply(
      'Failed to create the game. Please try again later.'
    );
  }

  const joinButton = new ButtonBuilder()
    .setCustomId(`worldwar-join-${warNumber}`)
    .setLabel('Join the WorldWar!')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(joinButton);

  const embed = new EmbedBuilder()
    .setTitle(`🌎 WorldWar #${warNumber}`)
    .setDescription(
      `> An epic battle is about to begin! Warriors from across the realm are gathering for the ultimate showdown.\n\n` +
        `⚔️ **Battle Requirements**\n` +
        `• Minimum Warriors: ${min}\n` +
        `• Maximum Warriors: ${max}\n\n` +
        `🎮 **Join the Battle!**\n` +
        `Click below to enter the battlefield!`
    )
    .setColor('#FF4444')
    .setTimestamp();

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function startGame(interaction) {
  const activeGame = await WorldWar.findOne({ status: 'active' });
  if (!activeGame)
    return interaction.reply(
      'No active WorldWar game found. Use `/worldwar setup` first.'
    );

  if (activeGame.participants.length < activeGame.minParticipants) {
    return interaction.reply(
      `Not enough participants to start the game. At least ${activeGame.minParticipants} are required.`
    );
  }

  interaction.reply(`WorldWar #${activeGame.warNumber} is starting!`);
  await runGame(interaction.channel, activeGame, interaction);
}

async function cancelGame(interaction) {
  const activeGame = await WorldWar.findOne({ status: 'active' });
  if (!activeGame)
    return interaction.reply('No active WorldWar game to cancel.');

  activeGame.status = 'canceled';
  await activeGame.save();

  interaction.reply(`WorldWar #${activeGame.warNumber} has been canceled.`);
}

async function stopGame(interaction) {
  const activeGame = await WorldWar.findOne({ status: 'active' });
  if (!activeGame) return interaction.reply('No active WorldWar game to stop.');

  activeGame.status = 'completed';
  activeGame.endedAt = Date.now();
  await activeGame.save();

  interaction.reply(
    `WorldWar #${activeGame.warNumber} has been stopped early.`
  );
}

async function runGame(channel, game, interaction) {
  let participants = game.participants;
  let kills = {};
  let joinTimes = {};

  participants.forEach((participant) => {
    kills[participant] = 0;
    joinTimes[participant] = Date.now();
  });

  while (participants.length > 1) {
    const killer =
      participants[Math.floor(Math.random() * participants.length)];
    const victim =
      participants[Math.floor(Math.random() * participants.length)];
    if (killer === victim) continue;

    kills[killer]++;

    participants = participants.filter((id) => id !== victim);
    game.eliminated.push(victim);
    await game.save();

    await announceElimination(
      channel,
      killer,
      victim,
      participants.length,
      interaction.guild
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const winner = participants[0];
  game.winner = winner;
  game.status = 'completed';
  game.endedAt = Date.now();
  await game.save();
  const survivorTime = ((Date.now() - joinTimes[winner]) / 1000 / 60).toFixed(
    2
  );
  displayWinner(
    channel,
    winner,
    game.warNumber,
    interaction.guild,
    kills,
    survivorTime
  );
}

async function announceElimination(channel, killer, victim, remaining, guild) {
  const canvas = Canvas.createCanvas(1200, 600);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage(
    path.join(__dirname, '../../utils/worldwar-background.png')
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  let killerAvatar, victimAvatar;

  try {
    const killerUser = guild.members.cache.get(killer);
    const killerAv = killerUser.displayAvatarURL({
      format: 'webp',
      size: 256,
    });
    const killerResponse = await fetch(killerAv);
    const killerBuffer = await killerResponse.buffer();
    const killerPngBuffer = await sharp(killerBuffer).png().toBuffer();
    killerAvatar = await Canvas.loadImage(killerPngBuffer);
  } catch (error) {
    console.warn(`Failed to load killer avatar for ${killer}: ${error.message}`);
    killerAvatar = await createPlaceholderAvatar(256);
  }

  try {
    const victimUser = guild.members.cache.get(victim);
    const victimAv = victimUser.displayAvatarURL({
      format: 'png',
      size: 256,
    });
    const victimResponse = await fetch(victimAv);
    const victimBuffer = await victimResponse.buffer();
    const victimPngBuffer = await sharp(victimBuffer).png().toBuffer();
    victimAvatar = await Canvas.loadImage(victimPngBuffer);
  } catch (error) {
    console.warn(`Failed to load victim avatar for ${victim}: ${error.message}`);
    victimAvatar = await createPlaceholderAvatar(256);
  }

  const verticalCenter = (canvas.height - 400) / 2;

  ctx.drawImage(killerAvatar, 100, verticalCenter, 400, 400);

  ctx.drawImage(victimAvatar, 700, verticalCenter, 400, 400);
  const victimImageData = ctx.getImageData(700, verticalCenter, 400, 400);
  const data = victimImageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i + 1] = data[i + 2] = avg;
  }

  ctx.putImageData(victimImageData, 700, verticalCenter);

  const sword = await Canvas.loadImage(
    path.join(__dirname, '../../utils/sword.png')
  );

  const swordWidth = 400;
  const swordHeight = 400;
  const swordX = (canvas.width - swordWidth) / 2;
  const swordY = (canvas.height - swordHeight) / 2;
  ctx.drawImage(sword, swordX, swordY, swordWidth, swordHeight);

  const eliminationMessages = [
    `⚔️ A mighty clash! <@${killer}> emerges victorious over <@${victim}>!`,
    `☠️ The battlefield claims another as <@${killer}> eliminates <@${victim}>!`,
    `⚡ With lightning speed, <@${killer}> strikes down <@${victim}>!`,
    `🗡️ <@${victim}> falls to <@${killer}>'s superior tactics!`,
    `💥 In an explosive confrontation, <@${killer}> prevails over <@${victim}>!`,
    `🔥 <@${killer}> unleashes a devastating attack, leaving <@${victim}> in ruins!`,
    `⚡ Like thunder from above, <@${killer}> smites <@${victim}>!`,
    `🌪️ In a whirlwind of steel, <@${killer}> overwhelms <@${victim}>!`,
    `💫 <@${killer}> executes a perfect strike, spelling doom for <@${victim}>!`,
    `⚔️ <@${victim}> meets their end at <@${killer}>'s masterful blade!`,
    `🎯 With deadly precision, <@${killer}> eliminates <@${victim}>!`,
    `💀 <@${victim}>'s last sight was <@${killer}>'s unstoppable assault!`,
    `⚡ <@${killer}> channels the power of lightning to destroy <@${victim}>!`,
    `🗡️ A dance of blades ends with <@${killer}> standing over <@${victim}>!`,
    `🔥 <@${killer}> burns through <@${victim}>'s defenses like wildfire!`,
    `💥 <@${killer}> crushes <@${victim}>'s hopes of victory!`,
    `⚔️ <@${victim}> learns too late of <@${killer}>'s true power!`,
    `🌋 Like an erupting volcano, <@${killer}> obliterates <@${victim}>!`,
    `❄️ <@${killer}> freezes <@${victim}>'s dreams of victory!`,
    `⛈️ <@${killer}> rains destruction upon <@${victim}>!`,
    `🌠 <@${killer}> becomes a legend by defeating <@${victim}>!`,
    `🏃 <@${victim}> couldn't escape <@${killer}>'s relentless pursuit!`,
    `💫 <@${killer}> performs a devastating combo on <@${victim}>!`,
    `🎭 <@${victim}>'s story ends at <@${killer}>'s hands!`,
    `🌊 <@${killer}> drowns <@${victim}>'s hopes in a tide of power!`,
  ];

  const eliminationMessage =
    eliminationMessages[Math.floor(Math.random() * eliminationMessages.length)];

  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: 'elimination.png',
  });

  const embed = new EmbedBuilder()
    .setTitle('☠️ Battlefield Report')
    .setDescription(eliminationMessage)
    .setImage('attachment://elimination.png')
    .setColor('#FF6B6B')
    .addFields(
      { name: '⚔️ Victor', value: `<@${killer}>`, inline: true },
      { name: '💀 Eliminated', value: `<@${victim}>`, inline: true },
      {
        name: '🎯 Remaining Warriors',
        value: `${remaining} fighters remain`,
        inline: false,
      }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed], files: [attachment] });
}

async function displayWinner(
  channel,
  winner,
  warNumber,
  guild,
  kills,
  survivorTime
) {
  const canvas = Canvas.createCanvas(600, 600);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage(
    path.join(__dirname, '../../utils/worldwar-background.png')
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  let winnerAvatar;

  try {
    const winnerUser = guild.members.cache.get(winner);
    const winnerAv = winnerUser.displayAvatarURL({
      format: 'webp',
      size: 256,
    });
    const winnerResponse = await fetch(winnerAv);
    const winnerBuffer = await winnerResponse.buffer();
    const winnerPngBuffer = await sharp(winnerBuffer).png().toBuffer();
    winnerAvatar = await Canvas.loadImage(winnerPngBuffer);
  } catch (error) {
    console.warn(`Failed to load winner avatar for ${winner}: ${error.message}`);
    winnerAvatar = await createPlaceholderAvatar(256);
  }

  const crown = await Canvas.loadImage(
    path.join(__dirname, '../../utils/crown.png')
  );

  const avatarX = (canvas.width - 256) / 2;
  const avatarY = (canvas.height - 256) / 2;
  ctx.drawImage(winnerAvatar, avatarX, avatarY, 256, 256);

  const crownWidth = 200;
  const crownHeight = 200;
  const crownX = (canvas.width - crownWidth) / 2;
  const crownY = avatarY - crownHeight / 2;
  ctx.drawImage(crown, crownX, crownY, crownWidth, crownHeight);

  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: 'winner.png',
  });

  const embed = new EmbedBuilder()
    .setTitle(`👑 Champion of WorldWar #${warNumber}`)
    .setDescription(
      `> The dust settles... A lone warrior stands victorious!\n\n` +
        `🏆 **CHAMPION: <@${winner}>**`
    )
    .setImage('attachment://winner.png')
    .setColor('#FFD700')
    .addFields(
      {
        name: '⚔️ Warrior Stats',
        value: `Kills: ${kills[winner]}\nSurvival Time: ${survivorTime} minutes`,
        inline: true,
      },
      { name: '🌟 Achievement', value: 'Ultimate Warrior', inline: true }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed], files: [attachment] });
}
