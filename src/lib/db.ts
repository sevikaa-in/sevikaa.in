import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

export const dbPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  keepAlive: true
});

// Catch background idle connection timeouts from Supabase/PostgreSQL pooler
dbPool.on('error', (err) => {
  console.warn('[DB Pool Background Idle Reset]:', err.message);
});

export async function queryDb(sql: string, params: any[] = []) {
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const client = await dbPool.connect();
      try {
        const res = await client.query(sql, params);
        return res;
      } finally {
        client.release();
      }
    } catch (err: any) {
      const isConnError = err.message && (
        err.message.includes('Connection terminated') || 
        err.message.includes('closed') || 
        err.code === 'ECONNRESET' ||
        err.code === '57P01'
      );
      if (isConnError && attempts < 3) {
        console.warn(`[DB Pool Retry] Attempt ${attempts} failed due to pool reset: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 200 * attempts));
        continue;
      }
      throw err;
    }
  }
}
