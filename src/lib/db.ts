import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

export const dbPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export async function queryDb(sql: string, params: any[] = []) {
  const client = await dbPool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}
