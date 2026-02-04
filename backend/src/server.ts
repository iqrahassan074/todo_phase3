import 'dotenv/config';
import app from './app';
import { initializeDb } from './utils/database.util';

const port = parseInt(process.env.PORT || '3000');

async function startServer() {
  // Initialize database (optional if DATABASE_URL missing)
  await initializeDb();

  // Start server using Node's built-in HTTP (Vercel will handle routing)
  app.listen(port, () => {
    console.log(`✅ Backend running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

if (require.main === module) {
  startServer();
}

export { app };

