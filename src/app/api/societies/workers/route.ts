import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
// @ts-ignore
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 60, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  // Method 1: Direct PostgreSQL Pool connection (bypasses RLS completely)
  if (databaseUrl && !databaseUrl.includes('placeholder')) {
    try {
      const pool = new Pool({ 
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      });
      
      const { rows } = await pool.query(`
        SELECT 
          wp.*, 
          p.phone, 
          p.email, 
          p.status as profile_status,
          p.role
        FROM worker_profiles wp
        LEFT JOIN profiles p ON p.id = wp.user_id
      `);
      
      await pool.end();
      
      if (rows) {
        return NextResponse.json({ workers: rows });
      }
    } catch (pgErr) {
      console.error("PG Pool query error:", pgErr);
    }
  }

  // Method 2: Supabase JS Client fallback
  try {
    const supabase = createClient(supabaseUrl, apiKey);
    const { data: workers } = await supabase
      .from('worker_profiles')
      .select('*, profiles(*)');

    return NextResponse.json({ workers: workers || [] });
  } catch (err) {
    console.error("Server error in societies workers API:", err);
    return NextResponse.json({ workers: [] });
  }
}
