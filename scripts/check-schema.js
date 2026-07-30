const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hcuvizvdsooeypetvmhm:au%24bb3dxJ%26Giq%40y@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testUpdate() {
  await client.connect();
  console.log('--- CONNECTED TO DATABASE ---');
  
  const userId = '83a9980d-0353-4503-8645-ca2a086f984d';
  console.log('EXECUTING DIRECT UPDATE FOR USER ID:', userId);

  const updateRes = await client.query(`
    UPDATE public.profiles 
    SET phone = $1 
    WHERE id = $2 
    RETURNING *
  `, ['7319127627', userId]);

  console.log('SUCCESS! UPDATED PROFILE ROW:', updateRes.rows[0]);

  await client.end();
}

testUpdate().catch(err => {
  console.error('UPDATE ERROR:', err);
  client.end();
});
