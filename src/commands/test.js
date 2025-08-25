const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Replies with a test message'),
    async execute(interaction) {
        await interaction.reply('your good g!');
    },
};
