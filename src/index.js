require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  Collection,
  IntentsBitField,
  ActivityType,
  Events,
} = require('discord.js');

// Create client with intents
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Store commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

// Recursive function to grab all .js command files
function getCommandFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getCommandFiles(fullPath)); // recurse into subfolders
    } else if (item.isFile() && item.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const commandFiles = getCommandFiles(commandsPath);

// Load commands into Collection
for (const file of commandFiles) {
  const command = require(file);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${file} is missing "data" or "execute".`);
  }
}

// Status messages (rotates every 20s)
const statuses = [
  { name: 'Receiving The Blasters...', type: ActivityType.Watching },
  { name: 'Packaging The X-Wings...', type: ActivityType.Watching },
  { name: 'Stars Wars Main Title...', type: ActivityType.Listening },
  { name: 'Delivering The Pulse Grenades...', type: ActivityType.Watching },
];

// When bot is ready
client.once(Events.ClientReady, (c) => {
  console.log(`✅ BX21-X14X Outpost is online.`);

  setInterval(() => {
    const random = Math.floor(Math.random() * statuses.length);
    client.user.setActivity(statuses[random]);
  }, 20000);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '❌ There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
});

// Login bot
client.login(process.env.TOKEN);