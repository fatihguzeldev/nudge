export class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] ℹ️  ${message}`, ...args);
  }

  static success(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] ✅ ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`[${this.getTimestamp()}] ❌ ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`[${this.getTimestamp()}] ⚠️  ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG === 'true') {
      console.log(`[${this.getTimestamp()}] 🐛 ${message}`, ...args);
    }
  }

  static schedule(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] 📅 ${message}`, ...args);
  }

  static message(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] 💬 ${message}`, ...args);
  }
}