# nudge

a lightweight self-motivation daemon that sends randomized, time-blocked messages throughout the day.

![nudge](assets/nudge.png)

## overview

nudge is a self-hosted daemon that helps you stay motivated by sending random messages at random times within specified time ranges. it's designed to be simple, reliable, and easily extensible.

## features

- **timezone-aware scheduling**: supports any iana timezone (default: europe/istanbul)
- **precise time ranges**: use hh:mm format for minute-level precision
- **multiple email clients**: brevo (api) and nodemailer (smtp) support
- **daily reset**: automatically generates new schedules every day at 00:00
- **graceful shutdown**: handles process termination properly
- **environment validation**: checks required configuration on startup
- **human-readable logging**: clear, timezone-aware log messages

## architecture

```
src/
├── app.ts                      # main daemon entry point
├── config.ts                   # nudge configuration
├── clients/                    # email client implementations
│   ├── client.ts               # abstract client interface
│   ├── brevo/                  # brevo api client
│   └── nodemailer/             # nodemailer smtp client
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
git clone https://github.com/fatihguzel/nudge.git
cd nudge
npm install
```

### 2. configure environment

copy `.env.example` to `.env` and configure:

```bash
# required
TIMEZONE=Europe/Istanbul
USE_CLIENTS=brevo,nodemailer

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

to add a new notification client:

1. create a new client class in `src/clients/`
2. extend the `Client` abstract class
3. implement the `sendMessage(message: Message)` method
4. add the client to the `ClientType` enum
5. update the `NudgeManager.initializeClients()` method
6. add configuration examples to the readme

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
