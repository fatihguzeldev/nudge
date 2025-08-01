import { describe, it, expect, beforeEach } from '@jest/globals';
import { MessageSelector } from '@/messages';
import { TimeInterval, Message } from '@/types';

describe('MessageSelector', () => {
  let messageSelector: MessageSelector;

  beforeEach(() => {
    messageSelector = new MessageSelector();
  });

  describe('selectRandomMessage', () => {
    it('should throw error when no messages available', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: []
      };

      expect(() => messageSelector.selectRandomMessage(interval))
        .toThrow('No messages available for interval test');
    });

    it('should return the only message when there is one', () => {
      const message: Message = { id: 'msg1', content: 'Single message' };
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: [message]
      };

      const selected = messageSelector.selectRandomMessage(interval);
      expect(selected).toBe(message);
    });

    it('should select messages with uniform distribution when no weights', () => {
      const messages: Message[] = [
        { id: 'msg1', content: 'Message 1' },
        { id: 'msg2', content: 'Message 2' },
        { id: 'msg3', content: 'Message 3' }
      ];

      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages
      };

      // Run multiple selections to verify randomness
      const selections = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const selected = messageSelector.selectRandomMessage(interval);
        selections.add(selected.id);
      }

      // Should have selected all messages at least once
      expect(selections.size).toBe(3);
    });

    it('should respect weights when selecting messages', () => {
      const messages: Message[] = [
        { id: 'msg1', content: 'Message 1', weight: 1 },
        { id: 'msg2', content: 'Message 2', weight: 9 } // 9x more likely
      ];

      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages
      };

      // Run many selections to verify weight distribution
      const counts = { msg1: 0, msg2: 0 };
      for (let i = 0; i < 1000; i++) {
        const selected = messageSelector.selectRandomMessage(interval);
        counts[selected.id as keyof typeof counts]++;
      }

      // msg2 should be selected approximately 9x more often
      const ratio = counts.msg2 / counts.msg1;
      expect(ratio).toBeGreaterThan(6); // Allow more variance for randomness
      expect(ratio).toBeLessThan(12);
    });

    it('should handle edge case where random number precision causes fallback', () => {
      // Mock Math.random to return a value that would trigger the fallback
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.9999999999); // Very close to 1

      const messages: Message[] = [
        { id: 'msg1', content: 'Message 1', weight: 1 }
      ];

      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages
      };

      const selected = messageSelector.selectRandomMessage(interval);
      expect(selected).toBe(messages[0]); // Should return the last message (fallback)

      // Restore Math.random
      Math.random = originalRandom;
    });
  });

  describe('getMessageStats', () => {
    it('should return correct message statistics', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: [
          { id: 'msg1', content: 'Message 1' },
          { id: 'msg2', content: 'Message 2', weight: 2 },
          { id: 'msg3', content: 'Message 3' },
          { id: 'msg4', content: 'Message 4', weight: 3 }
        ]
      };

      const stats = messageSelector.getMessageStats(interval);
      
      expect(stats.total).toBe(4);
      expect(stats.weighted).toBe(2);
      expect(stats.uniform).toBe(2);
    });
  });

  describe('validateMessages', () => {
    it('should return error for empty messages array', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: []
      };

      const errors = messageSelector.validateMessages(interval);
      expect(errors).toContain('Interval test has no messages');
    });

    it('should validate message properties', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: [
          { id: '', content: 'No ID' },
          { id: 'msg2', content: '' },
          { id: 'msg3', content: 'Valid', weight: -1 },
          { id: 'msg4', content: 'Also valid', weight: 0 }
        ]
      };

      const errors = messageSelector.validateMessages(interval);
      
      expect(errors).toContain('Message at index 0 in interval test has no ID');
      expect(errors).toContain('Message msg2 in interval test has empty content');
      expect(errors).toContain('Message msg3 in interval test has invalid weight: -1');
      expect(errors).toContain('Message msg4 in interval test has invalid weight: 0');
    });

    it('should return no errors for valid messages', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: [
          { id: 'msg1', content: 'Valid message' },
          { id: 'msg2', content: 'Another valid message', weight: 2 }
        ]
      };

      const errors = messageSelector.validateMessages(interval);
      expect(errors).toHaveLength(0);
    });
  });

  describe('simulateSelection', () => {
    it('should simulate message selection distribution', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: [
          { id: 'msg1', content: 'Message 1', weight: 1 },
          { id: 'msg2', content: 'Message 2', weight: 2 },
          { id: 'msg3', content: 'Message 3', weight: 3 }
        ]
      };

      const simulation = messageSelector.simulateSelection(interval, 6000);
      
      // Expected distribution: 1/6, 2/6, 3/6
      expect(simulation.get('msg1')).toBeGreaterThan(800);
      expect(simulation.get('msg1')).toBeLessThan(1200);
      
      expect(simulation.get('msg2')).toBeGreaterThan(1800);
      expect(simulation.get('msg2')).toBeLessThan(2200);
      
      expect(simulation.get('msg3')).toBeGreaterThan(2800);
      expect(simulation.get('msg3')).toBeLessThan(3200);
    });
  });
});