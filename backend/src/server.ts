import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app';
import { initializeDb } from './utils/database.util';

const PORT = Number(process.env.PORT) || 4000;

async function startService() {
  try {
    // Database (optional)
    await initializeDb();

    const server = serve({
      fetch: app.fetch,
      port: PORT,
    });

    console.log(`🚀 Backend service running on port ${PORT}`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down service...');
      server.close?.();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 Service stopped');
      server.close?.();
      process.exit(0);
    });

  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} already in use`);
      console.error(`👉 Close the running process or change PORT`);
    } else {
      console.error('❌ Failed to start backend service', error);
    }
    process.exit(1);
  }
}

startService();
