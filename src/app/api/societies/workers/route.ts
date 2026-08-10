import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { queryDb } from '@/lib/db';

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
  // Method 1: Centralized Database Pool query (Sanitized Public DTO)
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
        wp.video_url,
        wp.created_at
      FROM worker_profiles wp
      LEFT JOIN profiles p ON p.id = wp.user_id OR p.id = wp.id
      WHERE p.status = 'live' OR wp.verification_status = 'approved'
      ORDER BY wp.created_at DESC
    `);
    
    if (res?.rows) {
      return NextResponse.json({ workers: res.rows });
    }
  } catch (pgErr) {
    console.warn("Societies workers database query notice:", pgErr);
  }

  // Method 2: Supabase JS Client fallback
  try {
    const supabase = createClient(supabaseUrl, apiKey);
    const { data: workers } = await supabase
      .from('worker_profiles')
      .select('id, user_id, full_name, skills, languages, experience_years, preferred_society, preferred_location, expected_salary, verification_status, rating, profile_picture_url, video_url, created_at')
      .eq('verification_status', 'approved');

    return NextResponse.json({ workers: workers || [] });
  } catch (err) {
    console.error("Server error in societies workers API:", err);
    return NextResponse.json({ workers: [] });
  }
}
