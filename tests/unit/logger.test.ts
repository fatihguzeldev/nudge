import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Logger } from '@/utils/logger';

describe('Logger', () => {
  let consoleSpy: {
    log: jest.SpiedFunction<any>;
    error: jest.SpiedFunction<any>;
    warn: jest.SpiedFunction<any>;
  };

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
    };

    // Mock Date to ensure consistent timestamps in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('info', () => {
    it('should log info message with timestamp and emoji', () => {
      Logger.info('Test info message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ℹ️  Test info message'
      );
    });

    it('should log info message with additional arguments', () => {
      const testObj = { key: 'value' };
      Logger.info('Test message', testObj, 123);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ℹ️  Test message',
        testObj,
        123
      );
    });
  });

  describe('success', () => {
    it('should log success message with timestamp and emoji', () => {
      Logger.success('Test success message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ✅ Test success message'
      );
    });

    it('should log success message with additional arguments', () => {
      const testData = ['item1', 'item2'];
      Logger.success('Operation completed', testData);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ✅ Operation completed',
        testData
      );
    });
  });

  describe('error', () => {
    it('should log error message with timestamp and emoji', () => {
      Logger.error('Test error message');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ❌ Test error message'
      );
    });

    it('should log error message with error object', () => {
      const error = new Error('Something went wrong');
      Logger.error('Operation failed', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ❌ Operation failed',
        error
      );
    });
  });

  describe('warn', () => {
    it('should log warning message with timestamp and emoji', () => {
      Logger.warn('Test warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ⚠️  Test warning message'
      );
    });

    it('should log warning message with additional arguments', () => {
      Logger.warn('Deprecated method', 'Use newMethod() instead');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] ⚠️  Deprecated method',
        'Use newMethod() instead'
      );
    });
  });

  describe('debug', () => {
    it('should log debug message when DEBUG=true', () => {
      process.env.DEBUG = 'true';
      Logger.debug('Test debug message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] 🐛 Test debug message'
      );
    });

    it('should not log debug message when DEBUG is not set', () => {
      delete process.env.DEBUG;
      Logger.debug('Test debug message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should not log debug message when DEBUG=false', () => {
      process.env.DEBUG = 'false';
      Logger.debug('Test debug message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should log debug message with additional arguments when DEBUG=true', () => {
      process.env.DEBUG = 'true';
      const debugData = { state: 'testing' };
      Logger.debug('Debug info', debugData);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] 🐛 Debug info',
        debugData
      );
    });
  });

  describe('schedule', () => {
    it('should log schedule message with timestamp and emoji', () => {
      Logger.schedule('Task scheduled for 15:30');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] 📅 Task scheduled for 15:30'
      );
    });

    it('should log schedule message with additional arguments', () => {
      const taskDetails = { id: 'task-1', interval: 'morning' };
      Logger.schedule('Task created', taskDetails);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] 📅 Task created',
        taskDetails
      );
    });
  });

  describe('message', () => {
    it('should log message with timestamp and emoji', () => {
      Logger.message('Sending notification');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] 💬 Sending notification'
      );
    });

    it('should log message with additional arguments', () => {
      const messageData = { recipient: 'user123', content: 'Hello!' };
      Logger.message('Message sent', messageData);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[2025-01-01T12:00:00.000Z] 💬 Message sent',
        messageData
      );
    });
  });

  describe('getTimestamp', () => {
    it('should return current ISO timestamp', () => {
      // Test the timestamp format by calling info and checking the output
      Logger.info('Test');
      
      const calls = consoleSpy.log.mock.calls;
      expect(calls[0][0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should return different timestamps for different times', () => {
      Logger.info('First message');
      
      // Advance time by 1 second
      jest.advanceTimersByTime(1000);
      
      Logger.info('Second message');
      
      const calls = consoleSpy.log.mock.calls;
      expect(calls[0][0]).toBe('[2025-01-01T12:00:00.000Z] ℹ️  First message');
      expect(calls[1][0]).toBe('[2025-01-01T12:00:01.000Z] ℹ️  Second message');
    });
  });
});