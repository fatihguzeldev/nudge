import { NudgeManager } from './nudge/nudgeManager'
import { CronManager } from './scheduler/cronManager'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

class NudgeDaemon {
  private cronManager: CronManager

  constructor() {
    const nudgeManager = new NudgeManager()
    this.cronManager = new CronManager(nudgeManager)
  }

  /**
   * starts the nudge daemon
   */
  start(): void {
    console.log('nudge daemon: starting...')

    this.validateEnvironment()

    this.setupGracefulShutdown()

    this.cronManager.start()

    console.log('nudge daemon: started successfully')
  }

  /**
   * validates required environment variables
   */
  private validateEnvironment(): void {
    const required = ['TIMEZONE', 'USE_CLIENTS']
    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }
  }

  /**
   * sets up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      console.log(
        `nudge daemon: received ${signal}, shutting down gracefully...`,
      )
      this.cronManager.stop()
      process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }
}

const daemon = new NudgeDaemon()
daemon.start()
