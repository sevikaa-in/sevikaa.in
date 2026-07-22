const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found at', envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const equalIdx = trimmed.indexOf('=');
    if (equalIdx > 0) {
      const key = trimmed.slice(0, equalIdx).trim();
      let val = trimmed.slice(equalIdx + 1).trim();
      // Strip optional enclosing quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const connectionString = env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

async function runMigrations() {
  console.log('Connecting to database pooler...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for secure ap-southeast poolers
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // Read migrations directory
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run chronologically

    console.log(`Found ${files.length} migration file(s).`);

    for (const file of files) {
      console.log(`Applying database migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute SQL scripts
      await client.query(sql);
      console.log(`✓ Migration ${file} applied.`);
    }

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Database migration run failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
