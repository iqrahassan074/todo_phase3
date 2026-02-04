import { Context } from 'hono';
import { AIService } from '../services/ai.service';
import { ConversationService } from '../services/conversation.service';
import { TodoService } from '../services/todo.service';

export class ChatController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Handle chat messages
   */
  async handleChat(c: Context) {
    try {
      const { message, conversationId } = await c.req.json();

      if (!message || typeof message !== 'string') {
        return c.json({ error: 'Message is required and must be a string' }, 400);
      }

      // Extract user ID from auth context (assuming middleware sets it)
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      // Process the chat message with AI
      const result = await this.aiService.processChat(userId, message, conversationId);

      // Save the user's message to the conversation
      await ConversationService.addMessageToConversation(
        result.conversationId,
        'user',
        message
      );

      // Save the AI's response to the conversation
      await ConversationService.addMessageToConversation(
        result.conversationId,
        'assistant',
        result.response
      );

      return c.json({
        id: `msg_${Date.now()}`, // Generate a message ID
        content: result.response,
        conversationId: result.conversationId,
        todos: result.todos,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in chat handler:', error);

      if (error instanceof Error) {
        return c.json({
          error: 'Failed to process chat message',
          details: error.message
        }, 500);
      }

      return c.json({ error: 'Failed to process chat message' }, 500);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(c: Context) {
    try {
      const conversationId = c.req.param('id');
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      // Verify user owns this conversation
      const conversation = await ConversationService.getOrCreateConversation(userId, conversationId);
      if (conversation.userId !== userId) {
        return c.json({ error: 'Access denied' }, 403);
      }

      const history = await ConversationService.getConversationHistory(conversationId);

      return c.json(history);
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return c.json({ error: 'Failed to retrieve conversation history' }, 500);
    }
  }

  /**
   * Get all user conversations
   */
  async getUserConversations(c: Context) {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const conversations = await ConversationService.getUserConversations(userId);

      return c.json({ conversations });
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return c.json({ error: 'Failed to retrieve conversations' }, 500);
    }
  }
}