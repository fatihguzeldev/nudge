# Nudge Bot Testing Guide

This guide explains how to test the Nudge bot both automatically and manually.

## Automated Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

- **Unit Tests** (`tests/unit/`): Test individual modules in isolation
  - `config.test.ts` - Configuration management
  - `messages.test.ts` - Message selection logic
  - `scheduler.test.ts` - Scheduling functionality
  
- **Integration Tests** (`tests/integration/`):
  - `telegram.test.ts` - Telegram bot integration with mocks

## Manual Testing

### 1. Initial Setup Testing

1. **Environment Setup**
   ```bash
   # Copy environment example
   cp .env.example .env
   
   # Edit .env with your credentials
   ```

2. **Test Configuration Loading**
   ```bash
   # This should use default configuration
   pnpm start
   ```

3. **Test Custom Configuration**
   ```bash
   # Create custom config
   cp nudge.config.example.json nudge.config.json
   # Edit the file with your intervals
   pnpm start
   ```

### 2. Telegram Bot Testing

1. **Create Test Bot**
   - Talk to @BotFather on Telegram
   - Create a test bot with `/newbot`
   - Save the token

2. **Get Chat ID**
   - Send any message to your bot
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Find your chat ID in the response

3. **Test Connection**
   - Add credentials to `.env`
   - Run `pnpm start`
   - You should receive: "🎯 Nudge bot bağlantı testi başarılı!"

### 3. Scheduling Testing

1. **Test Immediate Message**
   - Create a config with current time:
   ```json
   {
     "intervals": [{
       "id": "test-now",
       "startTime": "HH:MM", // Current hour:minute
       "endTime": "HH:MM",   // +1 hour from start
       "enabled": true,
       "messages": [{"id": "m1", "content": "Test message"}]
     }]
   }
   ```

2. **Test Random Timing**
   - Create a 2-hour window starting now
   - Observe that message arrives at random time within window

3. **Test Multiple Intervals**
   - Create 3-4 intervals throughout the day
   - Verify each sends at appropriate random times

### 4. Message Selection Testing

1. **Test Weighted Messages**
   ```json
   {
     "messages": [
       {"id": "m1", "content": "Rare message", "weight": 1},
       {"id": "m2", "content": "Common message", "weight": 9}
     ]
   }
   ```
   - Run for several cycles
   - Verify weighted distribution

2. **Test Message Variety**
   - Add 5-10 different messages to an interval
   - Verify different messages are selected

### 5. Error Handling Testing

1. **Invalid Credentials**
   - Use wrong bot token
   - Verify error message and graceful exit

2. **Invalid Configuration**
   - Use invalid time format (e.g., "25:00")
   - Missing messages array
   - Verify validation errors

3. **Network Issues**
   - Disconnect internet after start
   - Verify error handling

### 6. Daemon Testing

1. **Graceful Shutdown**
   - Start daemon: `pnpm start`
   - Press Ctrl+C
   - Verify shutdown message in Telegram

2. **Long Running Test**
   - Run daemon for 24 hours
   - Verify messages arrive as scheduled
   - Check memory usage remains stable

## Testing Checklist

### Before Release

- [ ] All automated tests pass
- [ ] Test coverage > 80%
- [ ] Manual connection test successful
- [ ] At least one message received at random time
- [ ] Graceful shutdown works
- [ ] Error messages are helpful
- [ ] README instructions are accurate

### Integration Testing

1. **Full System Test**
   - Set up 3 intervals:
     - Morning (09:00-12:00)
     - Afternoon (14:00-17:00)
     - Evening (19:00-22:00)
   - Run for full day
   - Verify one message per interval at random times

2. **Timezone Testing**
   - Test with different timezone in config
   - Verify messages arrive at correct local times

3. **Performance Testing**
   - Add 10+ intervals with 20+ messages each
   - Verify daemon remains responsive
   - Check resource usage

## Debugging Tips

1. **Enable Debug Logging**
   ```bash
   DEBUG=true pnpm start
   ```

2. **Test Specific Module**
   ```bash
   pnpm test -- config.test.ts
   ```

3. **Check Scheduled Jobs**
   - The daemon logs all scheduled times
   - Verify times are within expected intervals

4. **Telegram Issues**
   - Test bot token with curl:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getMe
   ```

## Common Issues

1. **"Telegram bot token and chat ID are required"**
   - Ensure `.env` file exists and has correct values
   - Check for typos in variable names

2. **No messages received**
   - Verify interval time includes current time
   - Check timezone settings
   - Ensure interval is enabled

3. **Same message repeatedly**
   - Add more message variety
   - Check weight distribution

4. **Bot stops after first message**
   - Check for uncaught errors in logs
   - Verify all intervals have messages