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

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: 'assistant';
      content?: string;
      tool_calls?: MCPToolCall[];
    };
    finish_reason: string;
  }>;
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    });
  }

  /**
   * Process a chat message and generate a response
   */
  async processChat(
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<{
    response: string;
    conversationId: string;
    todos: Todo[];
    toolCalls?: MCPToolCall[];
  }> {
    // Get or create conversation
    const conv = await ConversationService.getOrCreateConversation(userId, conversationId);

    // Reconstruct conversation state (stateless design)
    let conversationState;
    try {
      conversationState = await ConversationService.reconstructConversationState(conv.id);
    } catch (error) {
      // If conversation doesn't exist yet, create with empty state
      conversationState = {
        conversation: conv,
        recentMessages: [],
        userTodos: []
      };
    }

    // Prepare messages for the AI
    const aiMessages = this.formatMessagesForAI(
      conversationState.recentMessages,
      message,
      conversationState.userTodos
    );

    // Define MCP tools for todo operations
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'todo_create',
          description: 'Create a new todo item',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the todo' },
              priority: { type: 'number', description: 'Priority level (0-5)' },
              dueDate: { type: 'string', description: 'Due date in ISO format (optional)' }
            },
            required: ['title']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'todo_update',
          description: 'Update an existing todo item',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The ID of the todo to update' },
              title: { type: 'string', description: 'The new title of the todo (optional)' },
              completed: { type: 'boolean', description: 'Whether the todo is completed (optional)' },
              priority: { type: 'number', description: 'New priority level (0-5) (optional)' }
            },
            required: ['id']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'todo_list',
          description: 'Get the list of todos for the user',
          parameters: {
            type: 'object',
            properties: {
              completed: { type: 'boolean', description: 'Filter by completion status (optional)' }
            }
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'todo_delete',
          description: 'Delete a todo item',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The ID of the todo to delete' }
            },
            required: ['id']
          }
        }
      }
    ];

    // Call the OpenAI API
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Could be configurable
      messages: aiMessages,
      tools: tools,
      tool_choice: 'auto',
    });

    // Process the response
    const choice = response.choices[0];
    let responseText = '';
    let executedToolCalls: MCPToolCall[] = [];
    let updatedTodos: Todo[] = [];

    if (choice?.message?.tool_calls && choice?.message?.tool_calls.length > 0) {
      // Execute the tools
      for (const toolCall of choice.message.tool_calls) {
        const result = await this.executeToolCall(toolCall, userId, conv.id);

        if (result.todos) {
          updatedTodos = result.todos;
        }

        executedToolCalls.push(toolCall);
      }

      // If there's also content in the response, use that
      if (choice?.message?.content) {
        responseText = choice.message.content;
      } else {
        // Generate a default response based on tool execution
        responseText = this.generateDefaultResponseFromToolCalls(choice.message.tool_calls);
      }
    } else {
      // No tool calls, just return the content
      responseText = choice?.message?.content || "I processed your request.";
    }

    return {
      response: responseText,
      conversationId: conv.id,
      todos: updatedTodos,
      toolCalls: executedToolCalls
    };
  }

  /**
   * Format messages for the AI model
   */
  private formatMessagesForAI(
    recentMessages: Message[],
    newUserMessage: string,
    userTodos: Todo[]
  ): Array<{ role: MessageRole | 'system'; content: string }> {
    // System message with instructions
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful todo management assistant. Help the user manage their todos using natural language.
      You can create, update, delete, and list todos.
      Available tools: todo_create, todo_update, todo_list, todo_delete.
      Always be concise and friendly.`
    };

    // Format existing messages
    const formattedMessages = recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add information about current todos
    if (userTodos.length > 0) {
      const todosInfo = {
        role: 'system' as const,
        content: `Current todos: ${userTodos.map(t =>
          `${t.id}: ${t.title} (${t.completed ? 'completed' : 'pending'}, priority: ${t.priority})`
        ).join('; ')}.`
      };
      formattedMessages.unshift(todosInfo);
    }

    // Add the new user message
    const newMessage = {
      role: 'user' as const,
      content: newUserMessage
    };

    return [systemMessage, ...formattedMessages, newMessage];
  }

  /**
   * Execute a tool call
   */
  private async executeToolCall(
    toolCall: MCPToolCall,
    userId: string,
    conversationId: string
  ): Promise<{ todos?: Todo[] }> {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    switch (functionName) {
      case 'todo_create':
        const newTodo = await TodoService.createTodo(
          userId,
          conversationId,
          args.title,
          args.priority || 0,
          args.dueDate ? new Date(args.dueDate) : undefined
        );
        return { todos: [newTodo] };

      case 'todo_update':
        const updatedTodo = await TodoService.updateTodo(args.id, {
          title: args.title,
          completed: args.completed,
          priority: args.priority
        });
        if (updatedTodo) {
          // Get all user todos to return the full list
          const allTodos = await TodoService.getUserTodos(userId);
          return { todos: allTodos };
        }
        return {};

      case 'todo_list':
        const todos = await TodoService.getUserTodos(userId, args.completed);
        return { todos };

      case 'todo_delete':
        await TodoService.deleteTodo(args.id);
        // Return updated list after deletion
        const remainingTodos = await TodoService.getUserTodos(userId);
        return { todos: remainingTodos };

      default:
        throw new Error(`Unknown tool: ${functionName}`);
    }
  }

  /**
   * Generate a default response based on tool calls
   */
  private generateDefaultResponseFromToolCalls(toolCalls: MCPToolCall[]): string {
    const actions: string[] = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      switch (functionName) {
        case 'todo_create':
          actions.push(`created a todo: "${args.title}"`);
          break;
        case 'todo_update':
          actions.push(`updated todo ${args.id}`);
          break;
        case 'todo_list':
          actions.push('retrieved your todo list');
          break;
        case 'todo_delete':
          actions.push(`deleted todo ${args.id}`);
          break;
      }
    }

    if (actions.length > 0) {
      return `I have ${actions.join(', and ')}. How else can I help you?`;
    }

    return "I've processed your request. How else can I help you?";
  }
}