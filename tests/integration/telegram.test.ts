import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TelegramNotifier } from '@/telegram';
import TelegramBot from 'node-telegram-bot-api';

// Mock the Telegram Bot API
jest.mock('node-telegram-bot-api');

describe('TelegramNotifier Integration', () => {
  let notifier: TelegramNotifier;
  let mockBot: jest.Mocked<TelegramBot>;
  
  const testToken = 'test-bot-token';
  const testChatId = 'test-chat-id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock bot instance
    mockBot = {
      getMe: jest.fn(),
      sendMessage: jest.fn(),
      stopPolling: jest.fn()
    } as any;

    // Mock the constructor
    (TelegramBot as jest.MockedClass<typeof TelegramBot>).mockImplementation(() => mockBot);
  });

  describe('constructor', () => {
    it('should throw error if token is missing', () => {
      expect(() => new TelegramNotifier('', testChatId))
        .toThrow('Telegram bot token and chat ID are required');
    });

    it('should throw error if chat ID is missing', () => {
      expect(() => new TelegramNotifier(testToken, ''))
        .toThrow('Telegram bot token and chat ID are required');
    });

    it('should create instance with valid credentials', () => {
      expect(() => new TelegramNotifier(testToken, testChatId))
        .not.toThrow();
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      notifier = new TelegramNotifier(testToken, testChatId);
    });

    it('should successfully initialize with valid bot', async () => {
      mockBot.getMe.mockResolvedValue({ 
        id: 123456789,
        is_bot: true,
        first_name: 'Test Bot',
        username: 'test_bot'
      } as any);

      await expect(notifier.initialize()).resolves.not.toThrow();
      expect(mockBot.getMe).toHaveBeenCalledTimes(1);
    });

    it('should throw error if bot initialization fails', async () => {
      mockBot.getMe.mockRejectedValue(new Error('Invalid token'));

      await expect(notifier.initialize()).rejects.toThrow('Invalid token');
    });

    it('should only initialize once', async () => {
      mockBot.getMe.mockResolvedValue({ 
        id: 123456789,
        is_bot: true,
        first_name: 'Test Bot',
        username: 'test_bot'
      } as any);

      await notifier.initialize();
      await notifier.initialize();

      expect(mockBot.getMe).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      notifier = new TelegramNotifier(testToken, testChatId);
      mockBot.getMe.mockResolvedValue({ 
        id: 123456789,
        is_bot: true,
        first_name: 'Test Bot',
        username: 'test_bot'
      } as any);
      mockBot.sendMessage.mockResolvedValue({} as any);
    });

    it('should send message successfully', async () => {
      const message = { id: 'test-msg', content: 'Test message' };

      await notifier.sendMessage(message);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        'Test message',
        {
          parse_mode: 'HTML',
          disable_notification: false
        }
      );
    });

    it('should initialize before sending if not initialized', async () => {
      const message = { id: 'test-msg', content: 'Test message' };

      await notifier.sendMessage(message);

      expect(mockBot.getMe).toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalled();
    });

    it('should throw error if sending fails', async () => {
      const message = { id: 'test-msg', content: 'Test message' };
      mockBot.sendMessage.mockRejectedValue(new Error('Network error'));

      await expect(notifier.sendMessage(message))
        .rejects.toThrow('Network error');
    });
  });

  describe('sendCustomMessage', () => {
    beforeEach(() => {
      notifier = new TelegramNotifier(testToken, testChatId);
      mockBot.getMe.mockResolvedValue({ 
        id: 123456789,
        is_bot: true,
        first_name: 'Test Bot',
        username: 'test_bot'
      } as any);
      mockBot.sendMessage.mockResolvedValue({} as any);
    });

    it('should send custom message successfully', async () => {
      await notifier.sendCustomMessage('Custom text');

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        'Custom text',
        {
          parse_mode: 'HTML',
          disable_notification: false
        }
      );
    });

    it('should initialize before sending custom message if not initialized', async () => {
      await notifier.sendCustomMessage('Custom text');

      expect(mockBot.getMe).toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalled();
    });

    it('should handle errors when sending custom message', async () => {
      const error = new Error('Network error');
      mockBot.sendMessage.mockRejectedValue(error);

      await expect(notifier.sendCustomMessage('Test message'))
        .rejects.toThrow('Network error');
    });
  });

  describe('sendStatusUpdate', () => {
    beforeEach(() => {
      notifier = new TelegramNotifier(testToken, testChatId);
      mockBot.getMe.mockResolvedValue({ 
        id: 123456789,
        is_bot: true,
        first_name: 'Test Bot',
        username: 'test_bot'
      } as any);
      mockBot.sendMessage.mockResolvedValue({} as any);
    });

    it('should send formatted status update', async () => {
      await notifier.sendStatusUpdate('Bot is running');

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        '🤖 <b>Nudge Bot Status</b>\n\nBot is running',
        expect.any(Object)
      );
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      notifier = new TelegramNotifier(testToken, testChatId);
    });

    it('should return true on successful connection', async () => {
      mockBot.getMe.mockResolvedValue({ 
        id: 123456789,
        is_bot: true,
        first_name: 'Test Bot',
        username: 'test_bot'
      } as any);
      mockBot.sendMessage.mockResolvedValue({} as any);

      const result = await notifier.testConnection();

      expect(result).toBe(true);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        '🎯 Nudge bot bağlantı testi başarılı! Bot çalışmaya hazır.',
        expect.any(Object)
      );
    });

    it('should return false on connection failure', async () => {
      mockBot.getMe.mockRejectedValue(new Error('Connection failed'));

      const result = await notifier.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      notifier = new TelegramNotifier(testToken, testChatId);
    });

    it('should stop polling when bot exists', () => {
      notifier.stop();

      expect(mockBot.stopPolling).toHaveBeenCalled();
    });

    it('should handle stop when bot is null', () => {
      // Create a notifier and manually set bot to null to test the guard
      const notifierWithNullBot = new TelegramNotifier(testToken, testChatId);
      (notifierWithNullBot as any).bot = null;

      expect(() => notifierWithNullBot.stop()).not.toThrow();
    });
  });
});