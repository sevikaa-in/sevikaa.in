const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const connectionString = process.env.DATABASE_URL;
console.log("🚀 Starting Worker Society Sync & Fix Script...");

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runSync() {
  const client = await pool.connect();
  try {
    console.log("✅ Connected to Supabase PostgreSQL!");

    // 1. Ensure preferred_society_name column exists
    await client.query(`
      ALTER TABLE public.worker_profiles 
      ADD COLUMN IF NOT EXISTS preferred_society_name text,
      ADD COLUMN IF NOT EXISTS secondary_society_name text;
    `);

    // 2. Sync preferred_society_name from societies table where preferred_society_id matches
    const idSyncRes = await client.query(`
      UPDATE public.worker_profiles wp
      SET preferred_society_name = s.name
      FROM public.societies s
      WHERE (wp.preferred_society_id::text = s.id::text)
        AND (wp.preferred_society_name IS NULL OR TRIM(wp.preferred_society_name) = '')
      RETURNING wp.id, wp.full_name, s.name as matched_society;
    `);
    console.log(`\n✅ Updated ${idSyncRes.rows.length} worker profiles using preferred_society_id:`);
    if (idSyncRes.rows.length > 0) console.table(idSyncRes.rows);

    // 3. Sync preferred_society_name from preferred_areas array if still null
    const areaSyncRes = await client.query(`
      UPDATE public.worker_profiles wp
      SET preferred_society_name = wp.preferred_areas[1]
      WHERE (wp.preferred_society_name IS NULL OR TRIM(wp.preferred_society_name) = '')
        AND wp.preferred_areas IS NOT NULL
        AND array_length(wp.preferred_areas, 1) > 0
        AND wp.preferred_areas[1] IS NOT NULL
        AND TRIM(wp.preferred_areas[1]) <> ''
      RETURNING wp.id, wp.full_name, wp.preferred_areas[1] as set_society;
    `);
    console.log(`\n✅ Updated ${areaSyncRes.rows.length} worker profiles using preferred_areas[1]:`);
    if (areaSyncRes.rows.length > 0) console.table(areaSyncRes.rows);

    // 4. Backfill preferred_society_id from public.societies if ID is null but preferred_society_name exists
    const backfillIdRes = await client.query(`
      UPDATE public.worker_profiles wp
      SET preferred_society_id = s.id
      FROM public.societies s
      WHERE wp.preferred_society_id IS NULL
        AND wp.preferred_society_name IS NOT NULL
        AND (
          s.name ILIKE CONCAT('%', wp.preferred_society_name, '%')
          OR wp.preferred_society_name ILIKE CONCAT('%', s.name, '%')
        )
      RETURNING wp.id, wp.full_name, wp.preferred_society_name, s.id as set_society_id;
    `);
    console.log(`\n✅ Backfilled preferred_society_id for ${backfillIdRes.rows.length} worker profiles:`);
    if (backfillIdRes.rows.length > 0) console.table(backfillIdRes.rows);

    // 5. Output Summary
    const summary = await client.query(`
      SELECT wp.id, wp.full_name, wp.preferred_society_name, wp.preferred_society_id, wp.preferred_areas
      FROM public.worker_profiles wp
      LIMIT 20;
    `);
    console.log("\n📊 Worker Profiles Society Summary:");
    console.table(summary.rows);

  } catch (err) {
    console.error("❌ DB Query Error:", err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runSync();
