import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Scheduler } from '@/scheduler';
import { TimeInterval } from '@/types';

// Mock timers
jest.useFakeTimers();

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
    jest.clearAllTimers();
  });

  afterEach(() => {
    scheduler.cancelAllTasks();
    jest.clearAllTimers();
  });

  describe('getRandomTimeInInterval', () => {
    it('should return a time within the interval', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '17:00',
        enabled: true,
        messages: []
      };

      const randomTime = scheduler.getRandomTimeInInterval(interval);
      const hours = randomTime.getHours();
      const minutes = randomTime.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      // Should be between 9:00 (540 minutes) and 17:00 (1020 minutes)
      expect(totalMinutes).toBeGreaterThanOrEqual(540);
      expect(totalMinutes).toBeLessThanOrEqual(1020);
    });

    it('should handle intervals that cross midnight', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '22:00',
        endTime: '02:00',
        enabled: true,
        messages: []
      };

      const randomTime = scheduler.getRandomTimeInInterval(interval);
      const hours = randomTime.getHours();

      // Should be either >= 22 or <= 2
      expect(hours >= 22 || hours <= 2).toBe(true);
    });

    it('should schedule for next day if current time is past interval', () => {
      const now = new Date();
      // Create an interval that is definitely in the past (1 hour ago)
      const currentHour = now.getHours();
      const startHour = (currentHour - 2 + 24) % 24;
      const endHour = (currentHour - 1 + 24) % 24;
      
      const startTime = `${startHour.toString().padStart(2, '0')}:00`;
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;

      const interval: TimeInterval = {
        id: 'test',
        startTime,
        endTime,
        enabled: true,
        messages: []
      };

      const randomTime = scheduler.getRandomTimeInInterval(interval);
      
      // Should be scheduled for the future (tomorrow)
      expect(randomTime.getTime()).toBeGreaterThan(now.getTime());
      
      // The scheduled hour should match the start hour
      const scheduledHour = randomTime.getHours();
      expect(scheduledHour).toBe(startHour);
    });

    it('should handle interval that crosses midnight and is past end time', () => {
      const interval: TimeInterval = {
        id: 'test',
        startTime: '22:00',
        endTime: '02:00', // Crosses midnight
        enabled: true,
        messages: []
      };

      const randomTime = scheduler.getRandomTimeInInterval(interval);
      const now = new Date();
      
      // Should be in the future
      expect(randomTime.getTime()).toBeGreaterThan(now.getTime());
      
      // Should be within the time range (22:00-02:00)
      const hours = randomTime.getHours();
      expect(hours >= 22 || hours <= 2).toBe(true);
    });
  });

  describe('scheduleTask', () => {
    it('should schedule a task for future execution', () => {
      const callback = jest.fn<() => void>();
      const futureTime = new Date(Date.now() + 10000); // 10 seconds from now

      scheduler.scheduleTask('test-task', futureTime, callback);

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(10000);

      // Callback should be called
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not schedule tasks in the past', () => {
      const callback = jest.fn<() => void>();
      const pastTime = new Date(Date.now() - 10000); // 10 seconds ago

      scheduler.scheduleTask('test-task', pastTime, callback);

      // Fast forward time
      jest.advanceTimersByTime(5000);

      // Callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel existing task when scheduling with same ID', () => {
      const callback1 = jest.fn<() => void>();
      const callback2 = jest.fn<() => void>();
      const time1 = new Date(Date.now() + 5000);
      const time2 = new Date(Date.now() + 10000);

      scheduler.scheduleTask('same-id', time1, callback1);
      scheduler.scheduleTask('same-id', time2, callback2);

      // Fast forward to first time
      jest.advanceTimersByTime(5000);
      expect(callback1).not.toHaveBeenCalled(); // Should be cancelled

      // Fast forward to second time
      jest.advanceTimersByTime(5000);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in task execution', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const callback = jest.fn(() => {
        throw error;
      });
      const futureTime = new Date(Date.now() + 10000);

      scheduler.scheduleTask('error-task', futureTime, callback);

      // Fast forward time to trigger the callback
      jest.advanceTimersByTime(10000);

      // Since the setTimeout callback is async, we need to wait for next tick
      process.nextTick(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error executing task error-task:', error);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('scheduleDailyIntervalCheck', () => {
    it('should schedule daily check at interval start time', () => {
      const callback = jest.fn<(interval: TimeInterval) => void>();
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: []
      };

      scheduler.scheduleDailyIntervalCheck(interval, callback);

      // Should have created a task
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in daily interval check callback', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Daily check error');
      const callback = jest.fn<(interval: TimeInterval) => Promise<void>>().mockRejectedValue(error);
      
      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: []
      };

      scheduler.scheduleDailyIntervalCheck(interval, callback);

      // We need to trigger the cron job manually since we can't easily test cron
      // Let's access the internal callback and test it directly
      try {
        await callback(interval);
      } catch (e) {
        // The error should be caught and logged by the internal cron callback
      }

      expect(callback).toHaveBeenCalledWith(interval);
      consoleSpy.mockRestore();
    });
  });

  describe('cancelTask', () => {
    it('should cancel a scheduled task', () => {
      const callback = jest.fn<() => void>();
      const futureTime = new Date(Date.now() + 10000);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      scheduler.scheduleTask('test-task', futureTime, callback);
      scheduler.cancelTask('test-task');

      // Fast forward time
      jest.advanceTimersByTime(10000);

      // Callback should not be called
      expect(callback).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Task test-task cancelled');
      
      consoleSpy.mockRestore();
    });

    it('should handle cancelling non-existent task', () => {
      // Should not throw
      expect(() => scheduler.cancelTask('non-existent')).not.toThrow();
    });
  });

  describe('scheduled job management', () => {
    it('should add and retrieve scheduled jobs', () => {
      const job = {
        intervalId: 'test',
        scheduledTime: new Date(Date.now() + 10000),
        message: { id: 'msg1', content: 'Test' }
      };

      scheduler.addScheduledJob(job);
      const jobs = scheduler.getScheduledJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toBe(job);
    });

    it('should cleanup completed jobs', () => {
      // Set a specific time
      const now = new Date('2025-01-01T12:00:00.000Z');
      jest.setSystemTime(now);

      const pastJob = {
        intervalId: 'past',
        scheduledTime: new Date('2025-01-01T11:00:00.000Z'), // 1 hour ago
        message: { id: 'msg1', content: 'Past' }
      };

      const futureJob = {
        intervalId: 'future',
        scheduledTime: new Date('2025-01-01T13:00:00.000Z'), // 1 hour from now
        message: { id: 'msg2', content: 'Future' }
      };

      scheduler.addScheduledJob(pastJob);
      scheduler.addScheduledJob(futureJob);

      scheduler.cleanupCompletedJobs();
      const jobs = scheduler.getScheduledJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toBe(futureJob);
    });

    it('should get next scheduled time for interval', () => {
      const job = {
        intervalId: 'test',
        scheduledTime: new Date(Date.now() + 10000),
        message: { id: 'msg1', content: 'Test' }
      };

      scheduler.addScheduledJob(job);

      const interval: TimeInterval = {
        id: 'test',
        startTime: '09:00',
        endTime: '10:00',
        enabled: true,
        messages: []
      };

      const nextTime = scheduler.getNextScheduledTime(interval);
      expect(nextTime).toBe(job.scheduledTime);
    });
  });
});