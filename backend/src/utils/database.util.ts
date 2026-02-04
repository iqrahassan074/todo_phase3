// backend/src/utils/database.util.ts
import { Pool, PoolConfig } from 'pg';

const dbUrl = process.env.DATABASE_URL;

let dbPool: Pool | null = null;

if (dbUrl) {
  const dbConfig: PoolConfig = {
    connectionString: dbUrl,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
  };
  dbPool = new Pool(dbConfig);
} else {
  console.warn('⚠️ DATABASE_URL not set, running without database');
}

export async function query(text: string, params?: any[]) {
  if (!dbPool) throw new Error('Database not initialized');
  return dbPool.query(text, params);
}

export async function initializeDb() {
  if (!dbPool) {
    console.warn('⚠️ Skipping database initialization');
    return;
  }
  try {
    await dbPool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
}
