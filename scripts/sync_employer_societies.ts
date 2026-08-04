import fs from 'fs';
import path from 'path';

// MUST parse .env.local BEFORE importing db.ts
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

// Dynamically import dbPool / queryDb AFTER environment variables are set
import { queryDb, dbPool } from '../src/lib/db';

async function syncEmployerSocieties() {
  console.log("🚀 Starting Employer Society Sync Script...");
  console.log("🔗 Connecting to DB host:", process.env.DATABASE_URL?.split('@')[1] || 'No DB URL');

  try {
    // 1. Ensure required columns exist
    await queryDb(`
      ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS society_name text;
      ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS total_flats integer;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS society_name text;
    `);

    // 2. Sync society_name from public.jobs / public.societies to public.employer_profiles
    const epSyncRes = await queryDb(`
      UPDATE public.employer_profiles ep
      SET society_name = COALESCE(j.society_name, s.name)
      FROM public.jobs j
      LEFT JOIN public.societies s ON s.id::text = j.society_id::text
      WHERE (ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text)
        AND (ep.society_name IS NULL OR TRIM(ep.society_name) = '')
        AND (j.society_name IS NOT NULL OR s.name IS NOT NULL)
      RETURNING ep.id, ep.user_id, ep.company_name, ep.society_name;
    `);

    console.log(`✅ Synced ${epSyncRes?.rows?.length || 0} employer profiles in public.employer_profiles:`);
    if (epSyncRes?.rows && epSyncRes.rows.length > 0) {
      console.table(epSyncRes.rows);
    }

    // 3. Sync society_name from public.jobs / public.societies to public.profiles
    const pSyncRes = await queryDb(`
      UPDATE public.profiles p
      SET society_name = COALESCE(j.society_name, s.name)
      FROM public.jobs j
      LEFT JOIN public.societies s ON s.id::text = j.society_id::text
      WHERE p.id::text = j.employer_id::text
        AND (p.society_name IS NULL OR TRIM(p.society_name) = '')
        AND (j.society_name IS NOT NULL OR s.name IS NOT NULL)
      RETURNING p.id, p.full_name, p.society_name;
    `);

    console.log(`✅ Synced ${pSyncRes?.rows?.length || 0} profiles in public.profiles:`);
    if (pSyncRes?.rows && pSyncRes.rows.length > 0) {
      console.table(pSyncRes.rows);
    }

    // 4. Fetch summary of employers with society names
    const summary = await queryDb(`
      SELECT ep.user_id, ep.company_name, ep.society_name, 
             COUNT(j.id) as jobs_count
      FROM public.employer_profiles ep
      LEFT JOIN public.jobs j ON j.employer_id::text = ep.user_id::text OR j.employer_id::text = ep.id::text
      GROUP BY ep.user_id, ep.company_name, ep.society_name
      ORDER BY jobs_count DESC;
    `);

    console.log("📊 Employer Societies Summary in PostgreSQL:");
    console.table(summary?.rows || []);

    console.log("🎉 Employer Society Sync Completed Successfully!");
    await dbPool.end();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Error executing employer society sync script:", err);
    await dbPool.end();
    process.exit(1);
  }
}

syncEmployerSocieties();
