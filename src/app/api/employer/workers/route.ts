import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

import { extractBearerOrCookieToken } from '@/lib/tokenExtractor';

export async function GET(request: NextRequest) {
  // Rate limiting: 60 req/min per IP (CRITICAL: fail-closed, no in-memory fallback)
  const rateLimit = await checkRateLimitCritical(extractClientIp(request), 60, 60000);
  if (rateLimit.unavailable) {
    return NextResponse.json({ error: 'Rate limiting service temporarily unavailable.' }, { status: 503 });
  }
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // 1. Extract Token from Bearer Header or Cookies
  const token = extractBearerOrCookieToken(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to view candidate directory.' }, { status: 401 });
  }

  // 2. Authenticate Session via Supabase / JWT Verification
  let user: any = null;
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: sbData } = await supabase.auth.getUser(token);
    if (sbData?.user) user = sbData.user;
  } catch {}

  if (!user) {
    const { decodeJwtPayload } = await import('@/lib/jwtHelper');
    const decoded = decodeJwtPayload(token);
    if (decoded && decoded.sub) {
      user = { id: decoded.sub, email: decoded.email };
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
  }

  // 3. Verify Employer / Admin Role in Database via queryDb
  const { queryDb } = await import('@/lib/db');
  const profRes = await queryDb(`SELECT role FROM public.profiles WHERE id = $1 LIMIT 1`, [user.id]);
  const callerRole = profRes?.rows?.[0]?.role || 'employer';

  if (!['employer', 'admin', 'super-admin'].includes(callerRole)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Worker candidate directory is restricted to employers and administrators.' }, { status: 403 });
  }

  // 4. Query Privacy View using Service-Role Client
  try {
    const { data: workers, error: dbErr } = await supabaseAdmin
      .from('employer_worker_directory')
      .select('id, user_id, full_name, gender, age, experience_years, expected_salary, skills, languages_spoken, primary_gated_society, preferred_shift, bio, profile_picture_url, avatar_url, status, rating, total_reviews, is_aadhaar_verified, is_police_verified, is_interview_verified, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbErr) {
      console.error('[employer/workers] Database query error:', dbErr.message);
      return NextResponse.json({ error: 'Database Error', message: 'Worker directory service temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    return NextResponse.json({ workers: workers || [] }, { status: 200 });
  } catch (err: any) {
    console.error('[employer/workers] Unexpected error:', err?.message);
    return NextResponse.json({ error: 'Service Error', message: 'Worker directory temporarily unavailable.' }, { status: 503 });
  }
}
