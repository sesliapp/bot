# @sesli/bot

The official SDK for building bots on the Sesli platform. 

## Installation

```bash
npm install @sesli/bot
```

Requires Node.js 18 or later.

## Before you start

Get your bot token from the [Developer Portal](https://sesli.app/developers). Don't hardcode it — use a `.env` file.

```
BOT_TOKEN=your_token_here
```

## Basic usage

```ts
import { Client } from '@sesli/bot';

const client = new Client({
  token: process.env.BOT_TOKEN!,
});

client.on('ready', (data) => {
  console.log(`${data.bot.username} is ready on ${data.servers.length} servers`);
});

client.login();
```

### Listening to messages

```ts
client.on('messageCreate', (message) => {
  if (message.author.isBot) return;

  if (message.content === '!ping') {
    client.messages.send(message.channelId, {
      content: 'Pong!',
    });
  }
});
```

### Registering and handling slash commands

Commands need to be registered inside the `ready` handler — `client.commands` isn't available before that.

```ts
import { Client, SlashCommandBuilder } from '@sesli/bot';

const client = new Client({ token: process.env.BOT_TOKEN! });

client.on('ready', async () => {
  const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency')
    .toJSON();

  await client.commands.register(pingCommand);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: 'Pong!' });
  }
});

client.login();
```

### Command with options

```ts
const sayCommand = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Make the bot say something')
  .addStringOption((opt) =>
    opt
      .setName('text')
      .setDescription('The text to say')
      .setRequired(true)
  )
  .toJSON();
```

Reading the option inside the interaction handler:

```ts
const text = interaction.options.getString('text');
```

### Sending an embed

```ts
client.messages.send(channelId, {
  embeds: [
    {
      title: 'Hello',
      description: 'This is an embed',
      color: 0x5865f2,
      fields: [
        { name: 'Field 1', value: 'Value 1', inline: true },
        { name: 'Field 2', value: 'Value 2', inline: true },
      ],
    },
  ],
});
```

## Events

| Event | When it fires |
|---|---|
| `ready` | Bot connected and ready |
| `messageCreate` | New message received |
| `messageUpdate` | Message was edited |
| `messageDelete` | Message was deleted |
| `interactionCreate` | Slash command was used |
| `serverMemberAdd` | Someone joined a server |
| `serverMemberRemove` | Someone left a server |
| `disconnect` | Connection dropped |
| `reconnect` | Reconnected to the gateway |
| `error` | An error occurred |

## Debug mode

If something isn't connecting properly, pass `debug: true` to log all gateway traffic.

```ts
const client = new Client({
  token: process.env.BOT_TOKEN!,
  debug: true,
});
```

## License

MIT
