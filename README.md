# nudge

a lightweight self-motivation daemon that sends randomized, time-blocked messages throughout the day.

![nudge](assets/nudge.png)

## overview

nudge is a self-hosted daemon that helps you stay motivated by sending random messages at random times within specified time ranges. it's designed to be simple, reliable, and easily extensible.

## features

- **timezone-aware scheduling**: supports any iana timezone (default: europe/istanbul)
- **precise time ranges**: use hh:mm format for minute-level precision
- **multiple notification clients**: brevo (api), nodemailer (smtp), telegram bot, and discord webhook support
- **daily reset**: automatically generates new schedules every day at 00:00
- **graceful shutdown**: handles process termination properly
- **environment validation**: checks required configuration on startup
- **human-readable logging**: clear, timezone-aware log messages

## architecture

```
src/
├── app.ts                      # main daemon entry point
├── config.ts                   # nudge configuration
├── clients/                    # notification client implementations
│   ├── client.ts               # abstract client interface
│   ├── brevo/                  # brevo api client
│   ├── nodemailer/             # nodemailer smtp client
│   ├── telegram/               # telegram bot client
│   └── discord/                # discord webhook client
├── nudge/                      # core nudge logic
│   ├── nudgeManager.ts         # nudge generation and execution
│   ├── types.ts                # nudge-related types
│   └── utils/                  # utility functions
│       └── randomGenerator.ts
├── scheduler/                  # scheduling logic
│   └── cronManager.ts          # daily reset and timeout management
└── types/                      # shared type definitions
    └── messages/
```

## quick start

### 1. clone and install

```bash
git clone https://github.com/fatihguzeldev/nudge.git
cd nudge
npm install
```

### 2. configure environment

copy `.env.example` to `.env` and configure:

```bash
# required
TIMEZONE=Europe/Istanbul
USE_CLIENTS=brevo,nodemailer,telegram,discord

# brevo configuration (optional)
BREVO_API_KEY=your_api_key
BREVO_SENDER_EMAIL=your@email.com
BREVO_SENDER_NAME=your_name
BREVO_TO_EMAIL=recipient@email.com

# nodemailer configuration (optional)
NODEMAILER_SMTP_HOST=smtp.gmail.com
NODEMAILER_SMTP_PORT=587
NODEMAILER_SMTP_SECURE=false
NODEMAILER_SMTP_AUTH_USER=your@email.com
NODEMAILER_SMTP_AUTH_PASS=your_app_password
NODEMAILER_SENDER_EMAIL=your@email.com
NODEMAILER_TO_EMAIL=recipient@email.com

# telegram configuration (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_PARSE_MODE=HTML
TELEGRAM_DISABLE_NOTIFICATION=false

# discord configuration (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. configure nudges

edit `src/config.ts` to define your time ranges and messages:

```typescript
export const NUDGE_CONFIG: NudgeConfig = {
  fallbackMessage: 'default nudge message',
  nudges: [
    {
      range: {
        startTime: '09:00', // 9:00 am
        endTime: '12:00', // 12:00 pm
      },
      messages: [
        { body: 'good morning! how are you today?' },
        { body: 'time to start your day!' },
      ],
    },
    {
      range: {
        startTime: '14:00', // 2:00 pm
        endTime: '17:00', // 5:00 pm
      },
      messages: [
        { body: 'afternoon check-in!' },
        { body: 'how is your work going?' },
      ],
    },
  ],
}
```

### 4. run the daemon

```bash
# development
npm run dev

# production
npm run build
npm start

# docker (recommended for cloud deployment)
docker build -t nudge .
docker run -d --name nudge-daemon --env-file .env nudge

# docker compose
docker-compose up -d
```

## how it works

### scheduling logic

1. **daemon startup**: generates nudges for the current day
2. **random generation**: for each time range, picks a random time and message
3. **settimeout scheduling**: schedules each nudge with precise timing
4. **daily reset**: at 00:00, clears old nudges and generates new ones
5. **execution**: sends messages through all configured clients

### timezone handling

- uses luxon for robust timezone support
- all times are interpreted in the configured timezone
- logs show human-readable times with timezone info
- supports any iana timezone string

### client system

- **abstract client interface**: easy to add new notification methods
- **multiple client support**: can use multiple clients simultaneously
- **error handling**: if one client fails, others are still tried
- **modular design**: each client is self-contained

## telegram setup

### creating a telegram bot

1. **create a bot with botfather**:

   - open telegram and search for `@BotFather`
   - send `/newbot` command
   - follow the prompts to name your bot
   - save the bot token you receive

2. **get your chat id**:

   - start a chat with your bot
   - send any message to your bot
   - visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - find your chat id in the response (look for `"chat":{"id":...}`)
   - alternatively, you can use @userinfobot to get your user id

3. **configure environment variables**:

   ```bash
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   TELEGRAM_PARSE_MODE=HTML  # optional, defaults to HTML
   TELEGRAM_DISABLE_NOTIFICATION=false  # optional, send silently
   ```

4. **add telegram to use_clients**:
   ```bash
   USE_CLIENTS=telegram
   # or combine with other clients
   USE_CLIENTS=telegram,brevo,nodemailer
   ```

### telegram message formatting

the telegram client supports three parse modes:

- **html**: basic html formatting (default)
  - `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`
- **markdown**: classic markdown formatting
  - `*bold*`, `_italic_`, `` `code` ``
- **markdownv2**: updated markdown with more features
  - requires escaping special characters

messages are automatically prefixed with `🔔 nudge reminder` for easy identification.

## discord setup

### creating a discord webhook

1. **open discord server settings**:

   - right-click on your server
   - select "server settings" > "integrations"

2. **create webhook**:

   - click "webhooks" > "new webhook"
   - choose a channel for notifications
   - customize name and avatar (optional)
   - copy the webhook url

3. **configure in .env** (only webhook URL is required):

   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefghijklmnop
   ```

4. **add discord to use_clients**:
   ```env
   USE_CLIENTS=discord
   # or combine with others:
   USE_CLIENTS=discord,telegram,brevo
   ```

### optional discord configuration

you can customize the discord messages with these optional settings:

```env
DISCORD_USERNAME=my custom bot     # defaults to "nudge bot"
DISCORD_AVATAR_URL=https://...     # custom avatar image
DISCORD_USE_EMBEDS=false           # defaults to true (rich formatting)
DISCORD_EMBED_COLOR=16711680       # decimal color (16711680 = red)
```

### discord message formatting

the discord client supports two modes:

- **rich embeds** (default): formatted messages with color, title, description, and timestamp
- **plain text**: simple text messages (set DISCORD_USE_EMBEDS=false)

messages are automatically prefixed with "🔔 **nudge reminder**" for easy identification.

## configuration

### time format

use `hh:mm` format for time ranges:

- `09:00` = 9:00 am
- `14:30` = 2:30 pm
- `23:59` = 11:59 pm

### message format

messages are simple strings:

```typescript
messages: [{ body: 'your message here' }, { body: 'another message' }]
```

### environment variables

| variable       | required    | description                   |
| -------------- | ----------- | ----------------------------- |
| `TIMEZONE`     | yes         | iana timezone string          |
| `USE_CLIENTS`  | yes         | comma-separated client list   |
| `BREVO_*`      | no (either) | brevo api configuration       |
| `NODEMAILER_*` | no (either) | nodemailer smtp configuration |
| `TELEGRAM_*`   | no (either) | telegram bot configuration    |
| `DISCORD_*`    | no (either) | discord webhook configuration |

## docker deployment

### quick docker setup

```bash
# build and run with docker
docker build -t nudge .
docker run -d --name nudge-daemon --env-file .env nudge

# or use docker compose
docker-compose up -d
```

### docker features

- **multi-stage build**: optimized production image
- **non-root user**: security best practices
- **health checks**: automatic health monitoring
- **restart policies**: automatic restart on failure
- **environment variables**: easy configuration via .env file
- **volume mounting**: persistent logs directory

### cloud deployment

docker makes it easy to deploy to any cloud platform:

- **railway**: `railway up`
- **render**: connect docker repository
- **fly.io**: `fly deploy`
- **digitalocean**: app platform with docker support
- **aws ecs**: container orchestration

## development

### project structure

- **typescript**: strict typing throughout
- **modular architecture**: loose coupling between components
- **error handling**: graceful degradation and clear error messages
- **logging**: comprehensive logging for debugging

### key components

- **nudgeManager**: core business logic for nudge generation and execution
- **cronManager**: scheduling and daily reset management
- **client system**: extensible notification system
- **randomGenerator**: time and message randomization

### testing

```bash
# lint
npm run lint

# format
npm run format

# build
npm run build
```

## contributing

we welcome contributions! here's how to get started:

### development setup

1. fork the repository
2. clone your fork: `git clone https://github.com/your-username/nudge.git`
3. install dependencies: `npm install`
4. create a feature branch: `git checkout -b feature/your-feature`

### coding guidelines

#### code style

- **typescript**: use strict typing, avoid `any` type
- **naming**: camelCase for variables, PascalCase for classes
- **comments**: lowercase comments, explain complex logic
- **readability**: add spaces between necessary lines to increase readability
- **error handling**: always handle errors gracefully
- **logging**: use descriptive log messages

#### clean code principles

- **single responsibility**: each class/function should have one clear purpose
- **dependency injection**: inject dependencies rather than creating them internally
- **separation of concerns**: keep business logic separate from infrastructure
- **dry (don't repeat yourself)**: avoid code duplication
- **solid principles**: follow single responsibility, open/closed, liskov substitution, interface segregation, dependency inversion
- **loose coupling**: minimize dependencies between modules
- **early returns**: use early returns instead of else statements (DO NOT USE ELSE STATEMENTS)

### commit conventions

use conventional commits:

```
type(scope): description

feat(client): add telegram client support
fix(scheduler): resolve timezone drift issue
docs(readme): update installation instructions
```

### pull request process

1. ensure your code follows the guidelines
2. add tests if applicable
3. update documentation if needed
4. submit a pull request with a clear description
5. wait for review and address feedback

### adding new clients

to add a new notification client (see telegram implementation as reference):

1. create a new client class in `src/clients/` (e.g., `src/clients/telegram/telegram.ts`)
2. extend the `Client` abstract class
3. implement the `sendMessage(message: Message)` method
4. add the client to the `ClientType` enum in `src/types/messages/common.ts`
5. update the `NudgeManager.initializeClients()` method in `src/nudge/nudgeManager.ts`
6. add configuration examples to `.env.example` and readme
7. create an index file for exports (e.g., `src/clients/telegram/index.ts`)
8. update `src/clients/index.ts` to export the new client

### reporting issues

when reporting issues, please include:

- operating system and version
- node.js version
- steps to reproduce
- expected vs actual behavior
- relevant log output

## license

this project is licensed under the agpl-3.0 license. see the [license](license) file for details.

## support

if you need help:

- check the [issues](https://github.com/fatihguzeldev/nudge/issues) page
- create a new issue with detailed information
- join our community discussions

## contact

- [my youtube channel](https://youtube.com/@fatihlovestosimplify)
- [my github account](https://github.com/fatihguzeldev)
- [my personal website](https://fatihguzel.dev)

---
