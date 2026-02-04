import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { chatRoutes } from './routes/chat.route';
import { authRoutes } from './routes/auth.route';
import { todoRoutes } from './routes/todo.route';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());

// Routes
app.route('/api/chat', chatRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/todos', todoRoutes);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
