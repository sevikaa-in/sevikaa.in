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

    // Create schema_migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        migration_name text PRIMARY KEY,
        applied_at timestamptz DEFAULT now()
      );
    `);

    // Read migrations directory
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run chronologically

    // Check if we need to auto-seed already applied baseline migrations
    const { rows: countRows } = await client.query('SELECT count(*) FROM public.schema_migrations');
    const migrationCount = parseInt(countRows[0].count, 10);
    
    if (migrationCount === 0) {
      const { rows: societiesExist } = await client.query(`
        SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'societies')
      `);
      if (societiesExist[0].exists) {
        console.log('Detected pre-existing database tables. Auto-recording baseline migrations...');
        const baselineFiles = files.filter(f => f < '20260726000000_sms_template_system.sql');
        for (const file of baselineFiles) {
          await client.query('INSERT INTO public.schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
          console.log(`Auto-recorded baseline migration: ${file}`);
        }
      }
    }

    // Fetch applied migrations again (in case we auto-seeded them)
    const { rows: appliedRows } = await client.query('SELECT migration_name FROM public.schema_migrations');
    const appliedMigrations = new Set(appliedRows.map(r => r.migration_name));

    console.log(`Found ${files.length} migration file(s) total.`);

    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`Migration ${file} is already applied. Skipping.`);
        continue;
      }

      console.log(`Applying database migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute SQL scripts in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (migration_name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✓ Migration ${file} applied and recorded.`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('All pending migrations completed successfully!');
  } catch (err) {
    console.error('Database migration run failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
