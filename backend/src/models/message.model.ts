export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class MessageModel {
  // Placeholder for message database operations
  static async findByConversationId(conversationId: string): Promise<Message[]> {
    // Implementation will connect to Neon PostgreSQL
    throw new Error('Method not implemented');
  }

  static async create(messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    // Implementation will connect to Neon PostgreSQL
    throw new Error('Method not implemented');
  }
}