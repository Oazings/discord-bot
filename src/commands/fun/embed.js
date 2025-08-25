const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ALLOWED_ROLE_ID = process.env.EMBED_ROLE; // 🔹 pulled from .env

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send a custom embed using Discohook-style JSON')
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('Upload a Discohook JSON file')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔒 Failsafe role restriction
    if (ALLOWED_ROLE_ID && !interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const file = interaction.options.getAttachment('file');

    if (!file.name.endsWith('.json')) {
      return interaction.reply({
        content: '❌ Please upload a valid `.json` file exported from Discohook!',
        ephemeral: true,
      });
    }

    try {
      const response = await fetch(file.url);
      const rawJson = await response.text();
      const data = JSON.parse(rawJson);

      const content = data.content || null;

      const embedsData = Array.isArray(data.embeds)
        ? data.embeds
        : (data.embeds ? [data.embeds] : []);

      const embeds = embedsData.map(embedData => new EmbedBuilder(embedData));

      if (!content && embeds.length === 0) {
        return interaction.reply({
          content: '❌ JSON file did not contain any `content` or `embeds`.',
          ephemeral: true,
        });
      }

      // Hide the "used /embed" message
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();

      // Post the embed directly to the channel
      await interaction.channel.send({ content: content || undefined, embeds });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Failed to parse JSON. Make sure it matches Discohook export format.',
        ephemeral: true,
      });
    }
  },
};
