import { Message, TimeInterval } from '@/types';

export class MessageSelector {
  /**
   * Select a random message from the interval
   * Supports weighted selection if weights are provided
   */
  public selectRandomMessage(interval: TimeInterval): Message {
    if (interval.messages.length === 0) {
      throw new Error(`No messages available for interval ${interval.id}`);
    }

    // Check if any messages have weights
    const hasWeights = interval.messages.some(msg => msg.weight !== undefined);

    if (hasWeights) {
      return this.selectWeightedRandomMessage(interval.messages);
    } else {
      return this.selectUniformRandomMessage(interval.messages);
    }
  }

  /**
   * Select a message with uniform probability
   */
  private selectUniformRandomMessage(messages: Message[]): Message {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  /**
   * Select a message based on weights
   */
  private selectWeightedRandomMessage(messages: Message[]): Message {
    // Calculate total weight
    const totalWeight = messages.reduce((sum, msg) => {
      return sum + (msg.weight || 1); // Default weight is 1
    }, 0);

    // Generate random number between 0 and totalWeight
    let random = Math.random() * totalWeight;

    // Find the message corresponding to the random value
    for (const message of messages) {
      const weight = message.weight || 1;
      random -= weight;
      if (random <= 0) {
        return message;
      }
    }

    // Fallback (should never reach here)
    return messages[messages.length - 1];
  }

  /**
   * Get message statistics for an interval
   */
  public getMessageStats(interval: TimeInterval): {
    total: number;
    weighted: number;
    uniform: number;
  } {
    const total = interval.messages.length;
    const weighted = interval.messages.filter(msg => msg.weight !== undefined).length;
    const uniform = total - weighted;

    return { total, weighted, uniform };
  }

  /**
   * Validate messages in an interval
   */
  public validateMessages(interval: TimeInterval): string[] {
    const errors: string[] = [];

    if (interval.messages.length === 0) {
      errors.push(`Interval ${interval.id} has no messages`);
    }

    interval.messages.forEach((message, index) => {
      if (!message.id) {
        errors.push(`Message at index ${index} in interval ${interval.id} has no ID`);
      }
      if (!message.content || message.content.trim() === '') {
        errors.push(`Message ${message.id} in interval ${interval.id} has empty content`);
      }
      if (message.weight !== undefined && message.weight <= 0) {
        errors.push(`Message ${message.id} in interval ${interval.id} has invalid weight: ${message.weight}`);
      }
    });

    return errors;
  }

  /**
   * Get a preview of how often each message would be selected
   * (useful for testing weight distribution)
   */
  public simulateSelection(interval: TimeInterval, iterations: number = 1000): Map<string, number> {
    const selectionCount = new Map<string, number>();

    // Initialize counts
    interval.messages.forEach(msg => {
      selectionCount.set(msg.id, 0);
    });

    // Simulate selections
    for (let i = 0; i < iterations; i++) {
      const selected = this.selectRandomMessage(interval);
      const currentCount = selectionCount.get(selected.id) || 0;
      selectionCount.set(selected.id, currentCount + 1);
    }

    return selectionCount;
  }
}