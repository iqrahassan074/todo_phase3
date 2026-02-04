import { TodoService } from './todo.service';
import { Todo } from '../models/todo.model';

export interface MCPTodoCreateRequest {
  title: string;
  priority?: number;
  dueDate?: string; // ISO string
}

export interface MCPTodoUpdateRequest {
  id: string;
  title?: string;
  completed?: boolean;
  priority?: number;
}

export interface MCPTodoListRequest {
  completed?: boolean;
}

export interface MCPTodoDeleteRequest {
  id: string;
}

export interface MCPTodoResponse {
  success: boolean;
  data?: Todo | Todo[];
  error?: string;
}

/**
 * Service to handle MCP (Model Context Protocol) tool integrations
 * This service provides standardized interfaces for AI agents to interact with the system
 */
export class MCPIntegrationService {
  /**
   * MCP Tool: Create a new todo
   */
  static async todoCreate(
    userId: string,
    conversationId: string,
    request: MCPTodoCreateRequest
  ): Promise<MCPTodoResponse> {
    try {
      const newTodo = await TodoService.createTodo(
        userId,
        conversationId,
        request.title,
        request.priority ?? 0,
        request.dueDate ? new Date(request.dueDate) : undefined
      );

      return {
        success: true,
        data: newTodo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * MCP Tool: Update an existing todo
   */
  static async todoUpdate(request: MCPTodoUpdateRequest): Promise<MCPTodoResponse> {
    try {
      const updatedTodo = await TodoService.updateTodo(request.id, {
        title: request.title,
        completed: request.completed,
        priority: request.priority
      });

      if (!updatedTodo) {
        return {
          success: false,
          error: 'Todo not found'
        };
      }

      return {
        success: true,
        data: updatedTodo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * MCP Tool: List todos for a user
   */
  static async todoList(userId: string, request: MCPTodoListRequest): Promise<MCPTodoResponse> {
    try {
      const todos = await TodoService.getUserTodos(userId, request.completed);

      return {
        success: true,
        data: todos
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * MCP Tool: Delete a todo
   */
  static async todoDelete(request: MCPTodoDeleteRequest): Promise<MCPTodoResponse> {
    try {
      const deleted = await TodoService.deleteTodo(request.id);

      if (!deleted) {
        return {
          success: false,
          error: 'Todo not found'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get MCP tool definitions for registration with AI models
   */
  static getMCPToolDefinitions() {
    return [
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
  }
}