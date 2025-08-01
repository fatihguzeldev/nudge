import * as cron from 'node-cron';
import { TimeInterval, ScheduledJob } from '@/types';

export class Scheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private scheduledJobs: ScheduledJob[] = [];

  /**
   * Get a random time within the given interval
   */
  public getRandomTimeInInterval(interval: TimeInterval): Date {
    const now = new Date();
    const [startHour, startMinute] = interval.startTime.split(':').map(Number);
    const [endHour, endMinute] = interval.endTime.split(':').map(Number);

    // Create dates for start and end times
    const startDate = new Date(now);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(endHour, endMinute, 0, 0);

    // If end time is before start time, it means it crosses midnight
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // If current time is past the end time, schedule for tomorrow
    if (now > endDate) {
      startDate.setDate(startDate.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);
    }

    // Get random timestamp between start and end
    const randomTimestamp = startDate.getTime() + 
      Math.random() * (endDate.getTime() - startDate.getTime());

    return new Date(randomTimestamp);
  }

  /**
   * Schedule a task to run at a specific time
   */
  public scheduleTask(
    id: string, 
    scheduledTime: Date, 
    callback: () => void | Promise<void>
  ): void {
    // Cancel existing task if any
    this.cancelTask(id);

    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.log(`⚠️ Scheduled time for ${id} is in the past, skipping`);
      return;
    }

    // Use setTimeout for one-time execution at random time
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.tasks.delete(id);
      } catch (error) {
        console.error(`Error executing task ${id}:`, error);
      }
    }, delay);

    // Store the timeout wrapped as a cron task for consistency
    const mockTask = {
      stop: () => clearTimeout(timeoutId)
    } as cron.ScheduledTask;

    this.tasks.set(id, mockTask);

    console.log(`📅 Task ${id} scheduled for ${scheduledTime.toLocaleString()}`);
  }

  /**
   * Schedule a recurring daily check for each interval
   */
  public scheduleDailyIntervalCheck(
    interval: TimeInterval,
    callback: (interval: TimeInterval) => void | Promise<void>
  ): void {
    const [hour, minute] = interval.startTime.split(':').map(Number);
    
    // Run daily at the start of each interval
    const cronExpression = `${minute} ${hour} * * *`;
    
    const task = cron.schedule(cronExpression, async () => {
      try {
        await callback(interval);
      } catch (error) {
        console.error(`Error in daily check for interval ${interval.id}:`, error);
      }
    });

    task.start();
    this.tasks.set(`daily-${interval.id}`, task);

    console.log(`🔄 Daily check scheduled for interval ${interval.id} at ${interval.startTime}`);
  }

  /**
   * Cancel a scheduled task
   */
  public cancelTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
      console.log(`🛑 Task ${id} cancelled`);
    }
  }

  /**
   * Cancel all scheduled tasks
   */
  public cancelAllTasks(): void {
    for (const [id, task] of this.tasks) {
      task.stop();
      console.log(`🛑 Task ${id} cancelled`);
    }
    this.tasks.clear();
    this.scheduledJobs = [];
  }

  /**
   * Get all active scheduled jobs
   */
  public getScheduledJobs(): ScheduledJob[] {
    return this.scheduledJobs;
  }

  /**
   * Add a scheduled job to the list
   */
  public addScheduledJob(job: ScheduledJob): void {
    this.scheduledJobs.push(job);
  }

  /**
   * Remove completed jobs from the list
   */
  public cleanupCompletedJobs(): void {
    const now = new Date();
    this.scheduledJobs = this.scheduledJobs.filter(job => job.scheduledTime > now);
  }

  /**
   * Get next scheduled time for an interval (for display purposes)
   */
  public getNextScheduledTime(interval: TimeInterval): Date | null {
    const job = this.scheduledJobs.find(j => j.intervalId === interval.id);
    return job ? job.scheduledTime : null;
  }
}