import { Conversation, ConversationModel } from '../models/conversation.model';
import { Message, MessageModel } from '../models/message.model';
import { Todo } from '../models/todo.model';

export class ConversationService {
  /**
   * Get or create a conversation
   */
  static async getOrCreateConversation(userId: string, conversationId?: string): Promise<Conversation> {
    if (conversationId) {
      const existing = await ConversationModel.findById(conversationId);
      if (existing && existing.userId === userId) {
        return existing;
      }
    }

    // Create a new conversation
    const newConversation = await ConversationModel.create({
      userId,
      title: `Conversation ${new Date().toLocaleDateString()}`
    });

    return newConversation;
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
    todos: Todo[];
  }> {
    // Get conversation details
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Get messages in the conversation
    const messages = await MessageModel.findByConversationId(conversationId);

    // For now, returning empty todos array - this would be populated by a todo service
    const todos: Todo[] = []; // This would come from TodoService

    return {
      conversation,
      messages,
      todos
    };
  }

  /**
   * Add a message to a conversation
   */
  static async addMessageToConversation(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Message> {
    const messageData = {
      conversationId,
      role,
      content,
      metadata
    };

    return await MessageModel.create(messageData);
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    return await ConversationModel.findByUserId(userId);
  }

  /**
   * Reconstruct conversation state from database (stateless design)
   */
  static async reconstructConversationState(conversationId: string): Promise<{
    conversation: Conversation;
    recentMessages: Message[];
    userTodos: Todo[];
  }> {
    // Get conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Get recent messages (last 10 for context)
    const allMessages = await MessageModel.findByConversationId(conversationId);
    const recentMessages = allMessages.slice(-10); // Last 10 messages for context

    // Get user's todos (would be filtered by conversation or all depending on needs)
    // For now, this would come from TodoService
    const userTodos: Todo[] = []; // This would be populated by TodoService.getUserTodos()

    return {
      conversation,
      recentMessages,
      userTodos
    };
  }
}