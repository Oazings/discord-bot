const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { REST, Routes } = require('discord.js');

// 🔹 Bot details from .env
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !guildId || !token) {
  console.error("❌ Missing one of CLIENT_ID, GUILD_ID, or DISCORD_TOKEN in .env");
  process.exit(1);
}

// Recursive command loader
function getCommandFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of list) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getCommandFiles(filePath));
    } else if (file.isFile() && file.name.endsWith('.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const foldersPath = path.join(__dirname, 'commands');
const commandFiles = getCommandFiles(foldersPath);

const commands = [];
for (const file of commandFiles) {
  const command = require(file);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ${file} is missing "data" or "execute".`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🔄 Refreshing application (/) commands...');

    // Register guild commands
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`✅ Successfully registered ${commands.length} commands for guild ${guildId}.`);
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }
})();
