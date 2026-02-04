import OpenAI from 'openai';
import { Message, MessageRole } from '../models/message.model';
import { Todo } from '../models/todo.model';
import { TodoService } from './todo.service';
import { ConversationService } from './conversation.service';

interface MCPToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
  type: 'function';
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is missing in .env');
    }
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async processChat(
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<{ response: string; conversationId: string; todos: Todo[] }> {

    const conv = await ConversationService.getOrCreateConversation(userId, conversationId);

    // Reconstruct conversation state safely
    let conversationState: { conversation: any; recentMessages: Message[]; userTodos: Todo[] };
    try {
      conversationState = await ConversationService.reconstructConversationState(conv.id);
    } catch {
      conversationState = { conversation: conv, recentMessages: [], userTodos: [] };
    }

    // Prepare AI messages
    const aiMessages: Array<{ role: MessageRole | 'system'; content: string }> = [
      {
        role: 'system',
        content: `You are a helpful todo management assistant. Help the user manage todos: create, update, list, delete.`
      },
      ...conversationState.recentMessages.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ];

    // Call OpenAI
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: aiMessages
    });

    // Safely extract first choice
    const choice = response.choices?.[0]?.message;
    const responseText = choice?.content ?? "I couldn't process your request.";

    // Optional: return todos (you can expand to execute tools later)
    const todos = await TodoService.getUserTodos(userId);

    return { response: responseText, conversationId: conv.id, todos };
  }
}
