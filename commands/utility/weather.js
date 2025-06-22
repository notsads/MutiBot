const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const UIUtils = require('../../utils/uiUtils');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get detailed weather information for any location.')
    .addStringOption((option) =>
      option
        .setName('location')
        .setDescription('The city, country, or coordinates to get weather for')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('unit')
        .setDescription('Temperature unit preference')
        .setRequired(false)
        .addChoices(
          { name: '🌡️ Celsius', value: 'celsius' },
          { name: '🌡️ Fahrenheit', value: 'fahrenheit' }
        )
    ),

  async execute(interaction) {
    const location = interaction.options.getString('location');
    const unit = interaction.options.getString('unit') || 'celsius';
    const apiKey = process.env.WEATHER_API;

    if (!apiKey) {
      const errorEmbed = UIUtils.createErrorEmbed(
        new Error('Weather API key not configured'),
        '❌ Weather Service Unavailable',
        [
          'Weather API key is not configured',
          'Please contact the bot administrator',
          'Weather features are currently disabled'
        ]
      );
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Show loading message
    const loadingEmbed = UIUtils.createAnimatedEmbed(
      '🌤️ Fetching Weather Data',
      `${UIUtils.getLoadingSpinner()} Searching for weather information in **${location}**...`,
      UIUtils.colors.info,
      'loading'
    );

    await interaction.reply({ embeds: [loadingEmbed] });

    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=yes`
      );

      if (!currentResponse.ok) {
        throw new Error(`API request failed with status ${currentResponse.status}`);
      }

      const currentData = await currentResponse.json();

      if (currentData.error) {
        throw new Error(currentData.error.message || 'Location not found');
      }

      // Fetch 3-day forecast
      const forecastResponse = await fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes`
      );

      let forecastData = null;
      if (forecastResponse.ok) {
        forecastData = await forecastResponse.json();
      }

      const weatherEmbed = this.createWeatherEmbed(currentData, forecastData, unit);
      const buttons = this.createWeatherButtons(location, unit);

      await interaction.editReply({ 
        embeds: [weatherEmbed], 
        components: [buttons] 
      });

    } catch (error) {
      const errorEmbed = UIUtils.createErrorEmbed(
        error,
        '❌ Weather Data Unavailable',
        [
          'Check if the location name is correct',
          'Try using a different city or country name',
          'Make sure the location exists and is accessible'
        ]
      );
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  createWeatherEmbed(currentData, forecastData, unit) {
    const current = currentData.current;
    const location = currentData.location;
    const isCelsius = unit === 'celsius';

    // Temperature conversion
    const temp = isCelsius ? current.temp_c : current.temp_f;
    const feelsLike = isCelsius ? current.feelslike_c : current.feelslike_f;
    const tempUnit = isCelsius ? '°C' : '°F';

    // Weather condition emoji
    const conditionEmoji = this.getWeatherEmoji(current.condition.code, current.is_day);
    
    // Air quality
    const aqi = currentData.current?.air_quality;
    const aqiLevel = aqi ? this.getAQILevel(aqi['us-epa-index']) : null;

    const embed = UIUtils.createAnimatedEmbed(
      `${conditionEmoji} Weather in ${location.name}, ${location.country}`,
      `**${temp}${tempUnit}** ${current.condition.text}\n**Feels like:** ${feelsLike}${tempUnit}\n\n**📍 Location:** ${location.name}, ${location.region || ''} ${location.country}\n**🕐 Local Time:** ${new Date(location.localtime).toLocaleString()}`,
      this.getWeatherColor(current.condition.code, current.is_day),
      'info',
      [
        {
          name: '🌡️ Temperature',
          value: `**Current:** ${temp}${tempUnit}\n**Feels Like:** ${feelsLike}${tempUnit}`,
          inline: true
        },
        {
          name: '💨 Wind',
          value: `**Speed:** ${isCelsius ? current.wind_kph : current.wind_mph} ${isCelsius ? 'km/h' : 'mph'}\n**Direction:** ${current.wind_dir}`,
          inline: true
        },
        {
          name: '💧 Humidity',
          value: `**${current.humidity}%**\n**Dew Point:** ${isCelsius ? current.dewpoint_c : current.dewpoint_f}${tempUnit}`,
          inline: true
        },
        {
          name: '👁️ Visibility',
          value: `**${isCelsius ? current.vis_km : current.vis_miles} ${isCelsius ? 'km' : 'miles'}**\n**UV Index:** ${current.uv}`,
          inline: true
        },
        {
          name: '🌫️ Pressure',
          value: `**${current.pressure_mb} mb**\n**${current.pressure_in} inHg**`,
          inline: true
        },
        {
          name: '🌤️ Conditions',
          value: `**${current.cloud}%** cloudy\n**${current.precip_mm}mm** precipitation`,
          inline: true
        }
      ]
    );

    // Add air quality if available
    if (aqiLevel) {
      embed.addFields({
        name: '🌬️ Air Quality',
        value: `**${aqiLevel.emoji} ${aqiLevel.name}**\nPM2.5: ${aqi.pm2_5} | PM10: ${aqi.pm10}`,
        inline: true
      });
    }

    // Add forecast if available
    if (forecastData && forecastData.forecast) {
      const forecast = forecastData.forecast.forecastday;
      const forecastText = forecast.map(day => {
        const date = new Date(day.date);
        const maxTemp = isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f;
        const minTemp = isCelsius ? day.day.mintemp_c : day.day.mintemp_f;
        const emoji = this.getWeatherEmoji(day.day.condition.code, true);
        return `${emoji} **${date.toLocaleDateString('en-US', { weekday: 'short' })}** ${minTemp}${tempUnit} - ${maxTemp}${tempUnit}`;
      }).join('\n');

      embed.addFields({
        name: '📅 3-Day Forecast',
        value: forecastText,
        inline: false
      });
    }

    embed.setFooter({ text: `Weather data provided by WeatherAPI • Last updated: ${new Date(current.last_updated_epoch * 1000).toLocaleTimeString()}` });

    return embed;
  },

  createWeatherButtons(location, unit) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`refresh_weather_${location}_${unit}`)
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`toggle_unit_${location}_${unit}`)
          .setLabel(unit === 'celsius' ? '🌡️ Switch to °F' : '🌡️ Switch to °C')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`forecast_${location}_${unit}`)
          .setLabel('📅 Extended Forecast')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`air_quality_${location}`)
          .setLabel('🌬️ Air Quality')
          .setStyle(ButtonStyle.Secondary)
      );

    return row;
  },

  getWeatherEmoji(code, isDay) {
    const emojis = {
      1000: isDay ? '☀️' : '🌙', // Clear
      1003: isDay ? '⛅' : '☁️', // Partly cloudy
      1006: '☁️', // Cloudy
      1009: '☁️', // Overcast
      1030: '🌫️', // Mist
      1063: '🌦️', // Patchy rain
      1066: '🌨️', // Patchy snow
      1069: '🌨️', // Patchy sleet
      1087: '⛈️', // Thundery outbreaks
      1114: '🌨️', // Blowing snow
      1117: '❄️', // Blizzard
      1135: '🌫️', // Fog
      1147: '🌫️', // Freezing fog
      1150: '🌦️', // Patchy light drizzle
      1153: '🌦️', // Light drizzle
      1168: '🌧️', // Freezing drizzle
      1171: '🌧️', // Heavy freezing drizzle
      1180: '🌦️', // Patchy light rain
      1183: '🌧️', // Light rain
      1186: '🌧️', // Moderate rain at times
      1189: '🌧️', // Moderate rain
      1192: '🌧️', // Heavy rain at times
      1195: '🌧️', // Heavy rain
      1198: '🌧️', // Light freezing rain
      1201: '🌧️', // Moderate or heavy freezing rain
      1204: '🌨️', // Light sleet
      1207: '🌨️', // Moderate or heavy sleet
      1210: '🌨️', // Patchy light snow
      1213: '🌨️', // Light snow
      1216: '🌨️', // Patchy moderate snow
      1219: '🌨️', // Moderate snow
      1222: '❄️', // Patchy heavy snow
      1225: '❄️', // Heavy snow
      1237: '🧊', // Ice pellets
      1240: '🌦️', // Light rain shower
      1243: '🌧️', // Moderate or heavy rain shower
      1246: '🌧️', // Torrential rain shower
      1249: '🌨️', // Light sleet showers
      1252: '🌨️', // Moderate or heavy sleet showers
      1255: '🌨️', // Light snow showers
      1258: '🌨️', // Moderate or heavy snow showers
      1261: '🧊', // Light showers of ice pellets
      1264: '🧊', // Moderate or heavy showers of ice pellets
      1273: '⛈️', // Patchy light rain with thunder
      1276: '⛈️', // Moderate or heavy rain with thunder
      1279: '⛈️', // Patchy light snow with thunder
      1282: '⛈️'  // Moderate or heavy snow with thunder
    };

    return emojis[code] || '🌤️';
  },

  getWeatherColor(code, isDay) {
    // Return different colors based on weather condition
    if (code >= 1000 && code <= 1003) return isDay ? 0xFFD700 : 0x4B0082; // Clear/Sunny
    if (code >= 1006 && code <= 1009) return 0x87CEEB; // Cloudy
    if (code >= 1030 && code <= 1032) return 0xD3D3D3; // Mist/Fog
    if (code >= 1063 && code <= 1087) return 0x4682B4; // Rain/Thunder
    if (code >= 1114 && code <= 1117) return 0xF0F8FF; // Snow
    if (code >= 1135 && code <= 1147) return 0xD3D3D3; // Fog
    if (code >= 1150 && code <= 1201) return 0x4682B4; // Rain
    if (code >= 1204 && code <= 1258) return 0xF0F8FF; // Snow
    if (code >= 1261 && code <= 1282) return 0x4682B4; // Mixed precipitation
    
    return UIUtils.colors.primary;
  },

  getAQILevel(epaIndex) {
    const levels = {
      1: { name: 'Good', emoji: '🟢' },
      2: { name: 'Moderate', emoji: '🟡' },
      3: { name: 'Unhealthy for Sensitive Groups', emoji: '🟠' },
      4: { name: 'Unhealthy', emoji: '🔴' },
      5: { name: 'Very Unhealthy', emoji: '🟣' },
      6: { name: 'Hazardous', emoji: '⚫' }
    };
    return levels[epaIndex] || { name: 'Unknown', emoji: '❓' };
  }
};
