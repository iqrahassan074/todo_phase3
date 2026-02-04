import { Hono } from 'hono';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const chatRoutes = new Hono();

const controller = new ChatController();

// Apply auth middleware to all chat routes
chatRoutes.use('*', authMiddleware);

// Chat endpoint
chatRoutes.post('/', (c) => controller.handleChat(c));

// Get conversation history
chatRoutes.get('/:id', (c) => controller.getConversationHistory(c));

// Get all user conversations
chatRoutes.get('/', (c) => controller.getUserConversations(c));

export { chatRoutes };