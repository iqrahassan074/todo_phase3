import { Hono } from 'hono';
import { TodoController } from '../controllers/todo.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const todoRoutes = new Hono();

const controller = new TodoController();

// Apply auth middleware to all todo routes
todoRoutes.use('*', authMiddleware);

// Get all todos
todoRoutes.get('/', (c) => controller.getAllTodos(c));

// Create a new todo
todoRoutes.post('/', (c) => controller.createTodo(c));

// Update a todo
todoRoutes.put('/:id', (c) => controller.updateTodo(c));

// Toggle todo completion
todoRoutes.patch('/:id/toggle', (c) => controller.toggleTodoCompletion(c));

// Delete a todo
todoRoutes.delete('/:id', (c) => controller.deleteTodo(c));

export { todoRoutes };