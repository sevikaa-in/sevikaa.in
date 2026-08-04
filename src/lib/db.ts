import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

export const dbPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 5000,
  keepAlive: true
});

// Catch background idle connection reset events from Supabase pooler
dbPool.on('error', (err) => {
  console.warn('[DB Pool Background Reset]:', err.message);
});

export async function queryDb(sql: string, params: any[] = []) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
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
      const errCode = err.code || '';
      const errMsg = err.message || '';

      const isTransientError = 
        errCode === 'ENOTFOUND' ||
        errCode === 'EAI_AGAIN' ||
        errCode === 'ETIMEDOUT' ||
        errCode === 'ECONNRESET' ||
        errCode === 'ECONNREFUSED' ||
        errCode === '57P01' ||
        errMsg.includes('Connection terminated') ||
        errMsg.includes('closed') ||
        errMsg.includes('timeout') ||
        errMsg.includes('getaddrinfo');

      if (isTransientError && attempts < maxAttempts) {
        console.warn(`[DB Pool Retry] Attempt ${attempts}/${maxAttempts} failed: ${errMsg}. Retrying in ${attempts * 150}ms...`);
        await new Promise(r => setTimeout(r, attempts * 150));
        continue;
      }
      throw err;
    }
  }
}
