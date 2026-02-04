import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

// Import your route handlers
import { chatRoutes } from './routes/chat.route';
import { authRoutes } from './routes/auth.route';
import { todoRoutes } from './routes/todo.route';

const honoApp = new Hono();

// Middleware
honoApp.use('*', logger());
honoApp.use('*', cors());
honoApp.use('*', secureHeaders());

// Routes
honoApp.route('/api/chat', chatRoutes);
honoApp.route('/api/auth', authRoutes);
honoApp.route('/api/todos', todoRoutes);

// Health check endpoint
honoApp.get('/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default honoApp;