import { NudgeManager } from '../nudge/nudgeManager'
import { DateTime } from 'luxon'

export class CronManager {
  private nudgeManager: NudgeManager
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(nudgeManager: NudgeManager) {
    this.nudgeManager = nudgeManager
  }

  /**
   * starts the cron manager with initial scheduling
   */
  start(): void {
    // generate initial nudges for today
    // ensure async generation is handled without blocking caller
    void this.generateAndScheduleNudges()

    // schedule next daily reset at 00:00
    this.scheduleDailyReset()
  }

  /**
   * generates nudges and schedules them with setTimeout
   */
  private async generateAndScheduleNudges(): Promise<void> {
    console.log('cronManager: generating daily nudges...')

    this.nudgeManager.clearScheduledNudges()

    // wait for async nudge generation (LLM or fallback) to complete
    await this.nudgeManager.generateDailyNudges()

    const nudgeIds = this.nudgeManager.getScheduledNudgeIds()

    for (const nudgeId of nudgeIds) {
      const nudge = this.nudgeManager.getScheduledNudge(nudgeId)
      if (!nudge) {
        continue
      }

      const timezone = process.env.TIMEZONE || 'Europe/Istanbul'
      const now = DateTime.now().setZone(timezone)
      const scheduledTime = DateTime.fromJSDate(nudge.scheduledTime).setZone(
        timezone,
      )
      const delay = scheduledTime.diff(now).as('milliseconds')

      if (delay <= 0) {
        console.log(
          `cronManager: nudge ${nudge.id} is already past due, skipping`,
        )
        continue
      }

      const humanReadableTime = scheduledTime.toFormat('yyyy-MM-dd HH:mm')

      console.log(
        `cronManager: scheduling nudge ${nudge.id} for ${humanReadableTime} (${timezone})`,
      )

      const timeout = setTimeout(async () => {
        console.log(`cronManager: executing nudge ${nudge.id}`)
        await this.nudgeManager.executeNudge(nudge.id)

        this.timeouts.delete(nudge.id)
      }, delay)

      this.timeouts.set(nudge.id, timeout)
    }
  }

  /**
   * schedules the next daily reset at 00:00
   */
  private scheduleDailyReset(): void {
    const timezone = process.env.TIMEZONE || 'Europe/Istanbul'
    const now = DateTime.now().setZone(timezone)
    const tomorrow = now.plus({ days: 1 }).startOf('day')
    const delay = tomorrow.diff(now).as('milliseconds')

    setTimeout(() => {
      console.log('cronManager: daily reset triggered')

      this.clearAllTimeouts()

      void this.generateAndScheduleNudges()

      this.scheduleDailyReset()
    }, delay)
  }

  /**
   * clears all scheduled timeouts
   */
  private clearAllTimeouts(): void {
    for (const [nudgeId, timeout] of this.timeouts) {
      clearTimeout(timeout)
      console.log(`cronManager: cleared timeout for nudge ${nudgeId}`)
    }
    this.timeouts.clear()
  }

  /**
   * stops the cron manager and cleans up
   */
  stop(): void {
    console.log('cronManager: stopping...')
    this.clearAllTimeouts()
  }
}
