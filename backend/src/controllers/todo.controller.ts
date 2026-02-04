import { Context } from 'hono';
import { TodoService } from '../services/todo.service';

export class TodoController {
  /**
   * Get all todos for the authenticated user
   */
  async getAllTodos(c: Context) {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      // Check for 'completed' query parameter
      const completedParam = c.req.query('completed');
      let completed: boolean | undefined;

      if (completedParam !== undefined) {
        completed = completedParam === 'true';
      }

      const todos = await TodoService.getUserTodos(userId, completed);

      return c.json({ todos });
    } catch (error) {
      console.error('Error getting todos:', error);
      return c.json({ error: 'Failed to retrieve todos' }, 500);
    }
  }

  /**
   * Create a new todo
   */
  async createTodo(c: Context) {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const { title, priority, dueDate } = await c.req.json();

      if (!title || typeof title !== 'string') {
        return c.json({ error: 'Title is required and must be a string' }, 400);
      }

      // Get conversation ID from auth context or create a default one
      const conversationId = c.get('conversationId') || `conv_${userId}_${Date.now()}`;

      const newTodo = await TodoService.createTodo(
        userId,
        conversationId,
        title.trim(),
        priority || 0,
        dueDate ? new Date(dueDate) : undefined
      );

      return c.json({ todo: newTodo }, 201);
    } catch (error) {
      console.error('Error creating todo:', error);
      return c.json({ error: 'Failed to create todo' }, 500);
    }
  }

  /**
   * Update an existing todo
   */
  async updateTodo(c: Context) {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const todoId = c.req.param('id');
      const { title, completed, priority } = await c.req.json();

      // Validate the todo belongs to the user
      const existingTodo = await TodoService.findTodoById(todoId);
      if (!existingTodo || existingTodo.userId !== userId) {
        return c.json({ error: 'Todo not found or access denied' }, 404);
      }

      const updateData: Partial<{ title: string; completed: boolean; priority: number }> = {};
      if (title !== undefined) updateData.title = title;
      if (completed !== undefined) updateData.completed = completed;
      if (priority !== undefined) updateData.priority = priority;

      const updatedTodo = await TodoService.updateTodo(todoId, updateData);

      if (!updatedTodo) {
        return c.json({ error: 'Failed to update todo' }, 500);
      }

      return c.json({ todo: updatedTodo });
    } catch (error) {
      console.error('Error updating todo:', error);
      return c.json({ error: 'Failed to update todo' }, 500);
    }
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodoCompletion(c: Context) {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const todoId = c.req.param('id');

      // Validate the todo belongs to the user
      const existingTodo = await TodoService.findTodoById(todoId);
      if (!existingTodo || existingTodo.userId !== userId) {
        return c.json({ error: 'Todo not found or access denied' }, 404);
      }

      const updatedTodo = await TodoService.toggleTodoCompletion(todoId);

      if (!updatedTodo) {
        return c.json({ error: 'Failed to update todo' }, 500);
      }

      return c.json({ todo: updatedTodo });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      return c.json({ error: 'Failed to update todo' }, 500);
    }
  }

  /**
   * Delete a todo
   */
  async deleteTodo(c: Context) {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const todoId = c.req.param('id');

      // Validate the todo belongs to the user
      const existingTodo = await TodoService.findTodoById(todoId);
      if (!existingTodo || existingTodo.userId !== userId) {
        return c.json({ error: 'Todo not found or access denied' }, 404);
      }

      const deleted = await TodoService.deleteTodo(todoId);

      if (!deleted) {
        return c.json({ error: 'Failed to delete todo' }, 500);
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting todo:', error);
      return c.json({ error: 'Failed to delete todo' }, 500);
    }
  }
}