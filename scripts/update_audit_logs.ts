import fs from 'fs';

// Parse .env.local synchronously before importing dbPool
try {
  const envContent = fs.readFileSync('c:/Sevikaa/.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
} catch (e) {}

// Dynamic import of queryDb after process.env is set
async function runUpdateScript() {
  console.log("Connecting to Database using:", process.env.DATABASE_URL ? "Supabase Pooler URL" : "None");
  const { queryDb } = await import('../src/lib/db');

  try {
    const res1 = await queryDb(`
      UPDATE public.audit_logs 
      SET admin_email = 'yugayatra@gmail.com', admin_name = 'yugayatra', actor = 'yugayatra@gmail.com'
      WHERE admin_email ILIKE '%societyadmin%' OR admin_email ILIKE '%yugayatra%' OR changes_summary ILIKE '%Super Admin%';
    `);
    console.log("SUCCESS: Updated Super Admin logs count:", res1?.rowCount || 0);

    const res2 = await queryDb(`
      UPDATE public.audit_logs 
      SET admin_email = 'sevikaa.in@gmail.com', admin_name = 'sevikaa.in', actor = 'sevikaa.in@gmail.com'
      WHERE (admin_email ILIKE '%admin%' OR admin_email IS NULL OR admin_email = '') AND admin_email NOT LIKE '%yugayatra%';
    `);
    console.log("SUCCESS: Updated Operations Admin logs count:", res2?.rowCount || 0);

    console.log("DONE: Database public.audit_logs table updated successfully via standalone script!");
    process.exit(0);
  } catch (err) {
    console.error("Database update error:", err);
    process.exit(1);
  }
}

runUpdateScript();
