import { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';

// In a real implementation, this would integrate with Better Auth
// For now, we'll implement a simplified version
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  // In a real implementation, extract and verify JWT token
  // For demo purposes, we'll simulate user authentication

  try {
    // Get token from header
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header missing or invalid' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // In a real implementation, verify the JWT token
    // const decoded = await verify(token, Bun.env.JWT_SECRET || '');
    // c.set('userId', decoded.userId);

    // For demo purposes, we'll simulate authentication
    // In a real app, you'd verify the JWT with your auth provider
    c.set('userId', 'demo-user-id');
    c.set('conversationId', `conv_demo-user-id_${Date.now()}`);

    return await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};