import { DateTime } from 'luxon'
import { NUDGE_CONFIG } from '../../config'

export class RandomGenerator {
  /**
   * generates a random time within the given range using specified timezone
   * @param range time range in 'HH:MM' format
   * @returns date object with random time for today in specified timezone
   */
  static generateRandomTime(range: {
    startTime: string
    endTime: string
  }): Date {
    const timezone = process.env.TIMEZONE || 'Europe/Istanbul'

    const today = DateTime.now().setZone(timezone).startOf('day')

    const [startHour, startMinute] = range.startTime.split(':').map(Number)
    const [endHour, endMinute] = range.endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    const randomMinutes = Math.floor(
      Math.random() * (endMinutes - startMinutes + 1) + startMinutes,
    )

    const randomHour = Math.floor(randomMinutes / 60)
    const randomMinute = randomMinutes % 60

    const randomTime = today.set({
      hour: randomHour,
      minute: randomMinute,
      second: 0,
      millisecond: 0,
    })

    return randomTime.toJSDate()
  }

  /**
   * selects a random message from the given array
   * @param messages array of messages to choose from
   * @returns randomly selected message
   */
  static selectRandomMessage(messages: { body: string }[]): string {
    if (messages.length === 0) {
      console.error('randomGenerator: no messages available to select from')

      return NUDGE_CONFIG.fallbackMessage
    }

    const randomIndex = Math.floor(Math.random() * messages.length)
    return messages[randomIndex].body
  }

  /**
   * generates a unique id for scheduled nudges
   * @returns unique string id
   */
  static generateNudgeId(): string {
    return `nudge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }
}
