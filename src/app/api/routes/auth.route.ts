import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller';

const authRoutes = new Hono();

const controller = new AuthController();

// Public routes (no auth required)
authRoutes.post('/register', (c) => controller.register(c));
authRoutes.post('/login', (c) => controller.login(c));

// Protected routes (auth required - middleware would be applied separately)
authRoutes.get('/profile', (c) => controller.getProfile(c));

export { authRoutes };