const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hcuvizvdsooeypetvmhm:au%24bb3dxJ%26Giq%40y@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  await client.connect();
  console.log('--- CONNECTED TO DATABASE ---');
  
  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employer_profiles'");
  console.log('EMPLOYER_PROFILES COLUMNS:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));
  
  // Add missing columns if they don't exist
  const colNames = cols.rows.map(r => r.column_name);
  if (!colNames.includes('city')) {
    await client.query("ALTER TABLE public.employer_profiles ADD COLUMN IF NOT EXISTS city text");
    console.log('ADDED COLUMN city to employer_profiles');
  }
  if (!colNames.includes('state')) {
    await client.query("ALTER TABLE public.employer_profiles ADD COLUMN IF NOT EXISTS state text");
    console.log('ADDED COLUMN state to employer_profiles');
  }
  if (!colNames.includes('pincode')) {
    await client.query("ALTER TABLE public.employer_profiles ADD COLUMN IF NOT EXISTS pincode text");
    console.log('ADDED COLUMN pincode to employer_profiles');
  }
  if (!colNames.includes('gstin')) {
    await client.query("ALTER TABLE public.employer_profiles ADD COLUMN IF NOT EXISTS gstin text");
    console.log('ADDED COLUMN gstin to employer_profiles');
  }

  await client.end();
}

inspect().catch(err => {
  console.error('INSPECT ERROR:', err);
  client.end();
});
