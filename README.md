# nudge

a minimal telegram daemon that sends random nudges throughout the day.

define your intervals, craft your messages, let nudge keep you on track.

## features

• random scheduling within time intervals  
• weighted message selection  
• simple json configuration  
• graceful daemon operation  

## quick start

```bash
# install
pnpm install

# setup environment
cp .env.example .env
# add your telegram bot token and chat id

# configure (optional)
cp nudge.config.example.json nudge.config.json

# run
pnpm dev
```

## telegram setup

1. message [@botfather](https://t.me/botfather)
2. create bot with `/newbot`
3. get your chat id: send a message then visit  
   `https://api.telegram.org/bot<token>/getUpdates`

## configuration

```json
{
  "intervals": [
    {
      "id": "morning",
      "startTime": "09:00",
      "endTime": "12:00",
      "enabled": true,
      "messages": [
        {
          "id": "m1",
          "content": "how's it going?",
          "weight": 1
        }
      ]
    }
  ]
}
```

## commands

```bash
pnpm dev        # development with reload
pnpm start      # production mode
pnpm build      # compile typescript
```

## environment

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

---

*simple. effective. minimal.*