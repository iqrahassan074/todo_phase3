import { Context } from 'hono';
import { User, UserModel } from '../models/user.model';

export class AuthController {
  /**
   * Get current user profile
   */
  async getProfile(c: Context) {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Return user info without sensitive data
      const { id, email, name, createdAt } = user;
      return c.json({ user: { id, email, name, createdAt } });
    } catch (error) {
      console.error('Error getting user profile:', error);
      return c.json({ error: 'Failed to retrieve user profile' }, 500);
    }
  }

  /**
   * Register a new user (simplified - in practice, use Better Auth)
   */
  async register(c: Context) {
    try {
      const { email, name, password } = await c.req.json();

      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return c.json({ error: 'User already exists' }, 409);
      }

      // In a real implementation, hash the password and use Better Auth
      const newUser = await UserModel.create({
        email,
        name: name || email.split('@')[0] // Use part of email as name if none provided
      });

      // Return user info without sensitive data
      const { id, createdAt } = newUser;
      return c.json({ user: { id, email, name: newUser.name, createdAt } }, 201);
    } catch (error) {
      console.error('Error registering user:', error);
      return c.json({ error: 'Failed to register user' }, 500);
    }
  }

  /**
   * Login (simplified - in practice, use Better Auth)
   */
  async login(c: Context) {
    try {
      const { email, password } = await c.req.json();

      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // In a real implementation, verify hashed password and use Better Auth
      // For now, we'll just return user info (in practice, return a JWT token)

      const { id, name, createdAt } = user;
      return c.json({ user: { id, email, name, createdAt } });
    } catch (error) {
      console.error('Error logging in:', error);
      return c.json({ error: 'Failed to login' }, 500);
    }
  }
}