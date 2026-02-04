import 'dotenv/config';
import app from './app';
import { initializeDb } from './utils/database.util';

// Initialize database if DATABASE_URL is set
initializeDb()
  .then(() => console.log('✅ Database initialized successfully'))
  .catch((err) => console.warn('⚠️ Database initialization skipped or failed:', err));

// Export the app for Vercel serverless
export default app;

