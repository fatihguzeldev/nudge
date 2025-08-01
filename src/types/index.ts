export interface TimeInterval {
  id: string;
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string;   // Format: "HH:MM" in 24-hour format
  messages: Message[];
  enabled: boolean;
}

export interface Message {
  id: string;
  content: string;
  weight?: number; // Optional weight for weighted random selection
}

export interface NudgeConfig {
  intervals: TimeInterval[];
  telegramBotToken: string;
  telegramChatId: string;
  timezone?: string; // Default: system timezone
}

export interface ScheduledJob {
  intervalId: string;
  scheduledTime: Date;
  message: Message;
}