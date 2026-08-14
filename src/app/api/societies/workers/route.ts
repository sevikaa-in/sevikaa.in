import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';
import { queryDb } from '@/lib/db';
import { getServerEnv } from '@/lib/env';

export async function GET(req: NextRequest) {
  const env = getServerEnv();
  const rateLimit = await checkRateLimitCritical(extractClientIp(req), 60, 60000);
  if (rateLimit.unavailable) {
    return NextResponse.json({ error: 'Rate limiting service temporarily unavailable.' }, { status: 503 });
  }
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  let pgSucceeded = false;

  // Method 1: Centralized Database Pool query with bounded pagination
  try {
    const res = await queryDb(`
      SELECT 
        wp.id,
        wp.user_id,
        wp.full_name,
        wp.skills,
        wp.languages,
        wp.experience_years,
        wp.preferred_society,
        wp.preferred_location,
        wp.expected_salary,
        wp.verification_status,
        wp.rating,
        wp.profile_picture_url,
        wp.created_at
      FROM worker_profiles wp
      LEFT JOIN profiles p ON p.id = wp.user_id OR p.id = wp.id
      WHERE p.status = 'live' OR wp.verification_status = 'approved'
      ORDER BY wp.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    if (res?.rows) {
      pgSucceeded = true;
      return NextResponse.json({ workers: res.rows, limit, offset, count: res.rows.length });
    }
  } catch (pgErr) {
    console.warn("Societies workers database query notice:", pgErr);
  }

  // Method 2: Supabase JS Client fallback
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !apiKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, apiKey);
    const { data: workers, error } = await supabase
      .from('worker_profiles')
      .select('id, user_id, full_name, skills, languages, experience_years, preferred_society, preferred_location, expected_salary, verification_status, rating, profile_picture_url, created_at')
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase query error in societies workers API:", error.message);
      return NextResponse.json({ error: 'Database service unavailable', message: error.message }, { status: 503 });
    }

    return NextResponse.json({ workers: workers || [], limit, offset, count: workers?.length || 0 });
  } catch (err: any) {
    console.error("Server error in societies workers API:", err);
    return NextResponse.json({ error: 'Database service unavailable', message: err?.message || 'Internal failure' }, { status: 503 });
  }
}
