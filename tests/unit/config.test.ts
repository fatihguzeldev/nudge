import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ConfigManager } from '@/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock environment variables
const originalEnv = process.env;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const testConfigPath = path.join(__dirname, '../fixtures/test-config.json');

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    // Clear telegram-specific env vars that might be loaded from .env
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    delete process.env.TZ;
    // Clear any module cache
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should load config from file if it exists', () => {
      configManager = new ConfigManager(testConfigPath);
      const config = configManager.getConfig();
      
      expect(config.intervals).toHaveLength(2);
      expect(config.intervals[0].id).toBe('test-interval-1');
      expect(config.timezone).toBe('UTC');
    });

    it('should use default config path when none provided', () => {
      configManager = new ConfigManager();
      const config = configManager.getConfig();
      
      // Should use default config since nudge.config.json doesn't exist in test env
      expect(config.intervals.length).toBeGreaterThan(0);
      // Should have telegramBotToken and telegramChatId properties
      expect(config).toHaveProperty('telegramBotToken');
      expect(config).toHaveProperty('telegramChatId');
    });

    it('should use default config if file does not exist', () => {
      configManager = new ConfigManager('/non/existent/path.json');
      const config = configManager.getConfig();
      
      expect(config.intervals.length).toBeGreaterThan(0);
      expect(config).toHaveProperty('telegramBotToken');
      expect(config).toHaveProperty('telegramChatId');
    });

    it('should handle malformed JSON file and use default config', () => {
      // Create a malformed JSON file
      const malformedPath = path.join(__dirname, 'malformed-config.json');
      fs.writeFileSync(malformedPath, '{ invalid json }');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      configManager = new ConfigManager(malformedPath);
      const config = configManager.getConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading config file:',
        expect.any(SyntaxError)
      );
      expect(config.intervals.length).toBeGreaterThan(0);
      expect(config).toHaveProperty('telegramBotToken');
      expect(config).toHaveProperty('telegramChatId');

      // Clean up
      fs.unlinkSync(malformedPath);
      consoleSpy.mockRestore();
    });

    it('should override config values with environment variables', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';
      process.env.TZ = 'America/New_York';

      configManager = new ConfigManager(testConfigPath);
      const config = configManager.getConfig();

      expect(config.telegramBotToken).toBe('test-token');
      expect(config.telegramChatId).toBe('test-chat-id');
      expect(config.timezone).toBe('America/New_York');
    });
  });

  describe('getActiveIntervals', () => {
    it('should return only enabled intervals', () => {
      configManager = new ConfigManager(testConfigPath);
      const activeIntervals = configManager.getActiveIntervals();

      expect(activeIntervals).toHaveLength(1);
      expect(activeIntervals[0].id).toBe('test-interval-1');
      expect(activeIntervals[0].enabled).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should return errors for missing telegram credentials', () => {
      configManager = new ConfigManager(testConfigPath);
      const errors = configManager.validateConfig();

      expect(errors).toContain('Telegram bot token is missing');
      expect(errors).toContain('Telegram chat ID is missing');
    });

    it('should return no errors for valid config', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      configManager = new ConfigManager(testConfigPath);
      const errors = configManager.validateConfig();

      expect(errors).toHaveLength(0);
    });

    it('should validate time format', () => {
      const invalidConfig = {
        intervals: [{
          id: 'test',
          startTime: '25:00', // Invalid hour
          endTime: '10:60',   // Invalid minute
          enabled: true,
          messages: []
        }],
        telegramBotToken: 'token',
        telegramChatId: 'chat'
      };

      // Create a temporary config file
      const tempPath = path.join(__dirname, 'temp-invalid-config.json');
      fs.writeFileSync(tempPath, JSON.stringify(invalidConfig));

      configManager = new ConfigManager(tempPath);
      const errors = configManager.validateConfig();

      expect(errors).toContain('Invalid start time format for interval test: 25:00');
      expect(errors).toContain('Invalid end time format for interval test: 10:60');
      expect(errors).toContain('No messages defined for interval test');

      // Clean up
      fs.unlinkSync(tempPath);
    });
  });

  describe('updateInterval', () => {
    it('should update an existing interval', () => {
      const tempConfigPath = path.join(__dirname, 'temp-config.json');
      fs.copyFileSync(testConfigPath, tempConfigPath);

      configManager = new ConfigManager(tempConfigPath);
      configManager.updateInterval('test-interval-1', {
        enabled: false,
        startTime: '10:00'
      });

      const config = configManager.getConfig();
      const updatedInterval = config.intervals.find(i => i.id === 'test-interval-1');

      expect(updatedInterval?.enabled).toBe(false);
      expect(updatedInterval?.startTime).toBe('10:00');
      expect(updatedInterval?.endTime).toBe('10:00'); // Unchanged

      // Clean up
      fs.unlinkSync(tempConfigPath);
    });

    it('should not update non-existent interval', () => {
      configManager = new ConfigManager(testConfigPath);
      const originalConfig = configManager.getConfig();
      
      configManager.updateInterval('non-existent', { enabled: false });
      
      const config = configManager.getConfig();
      expect(config).toEqual(originalConfig);
    });
  });
});