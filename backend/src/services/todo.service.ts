import { Todo, TodoModel } from '../models/todo.model';
import { Conversation } from '../models/conversation.model';

export class TodoService {
  /**
   * Get all todos for a specific user
   */
  static async getUserTodos(userId: string, completed?: boolean): Promise<Todo[]> {
    return await TodoModel.findByUserId(userId, completed);
  }

  /**
   * Create a new todo
   */
  static async createTodo(
    userId: string,
    conversationId: string,
    title: string,
    priority: number = 0,
    dueDate?: Date
  ): Promise<Todo> {
    const todoData = {
      conversationId,
      userId,
      title,
      priority,
      dueDate
    };

    return await TodoModel.create(todoData);
  }

  /**
   * Update an existing todo
   */
  static async updateTodo(
    id: string,
    updateData: Partial<Omit<Todo, 'id' | 'userId' | 'conversationId'>>
  ): Promise<Todo | null> {
    return await TodoModel.update(id, updateData);
  }

  /**
   * Toggle todo completion status
   */
  static async toggleTodoCompletion(id: string): Promise<Todo | null> {
    const todo = await TodoModel.findById(id);
    if (!todo) return null;

    return await TodoModel.update(id, { completed: !todo.completed });
  }

  /**
   * Delete a todo
   */
  static async deleteTodo(id: string): Promise<boolean> {
    return await TodoModel.delete(id);
  }

  /**
   * Find a specific todo by ID
   */
  static async findTodoById(id: string): Promise<Todo | null> {
    return await TodoModel.findById(id);
  }
}