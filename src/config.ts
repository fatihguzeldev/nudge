export interface NudgeConfig {
  fallbackMessage: string
  nudges: {
    // 24-hour format 'HH:MM'
    range: {
      startTime: string
      endTime: string
    }
    messages: {
      body: string
    }[]
  }[]
}

export const NUDGE_CONFIG: NudgeConfig = {
  fallbackMessage: 'yo yo yo, you forgot to set a message',
  nudges: [
    {
      range: {
        startTime: '15:13',
        endTime: '15:14',
      },
      messages: [
        {
          body: 'Hello, how are you?',
        },
        {
          body: 'Are you doing well? I hope you are doing well.',
        },
        {
          body: 'Test message 3',
        },
        {
          body: 'Test message 4',
        },
      ],
    },
  ],
}
