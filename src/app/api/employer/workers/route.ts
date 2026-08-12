import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { checkRateLimitAsync, extractClientIp } from '@/lib/rateLimiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function GET(request: NextRequest) {
  // Rate limiting: 60 req/min per IP via distributed Redis sliding window
  const rateLimit = await checkRateLimitAsync(extractClientIp(request), 60, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // 1. Extract Bearer Token
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    const sbCookie = Array.from(request.cookies.getAll()).find(c => 
      c.name.includes('auth-token') || c.name.includes('access-token') || c.name.endsWith('-auth-token')
    );
    if (sbCookie?.value) {
      try {
        const parsed = JSON.parse(sbCookie.value);
        token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null) || sbCookie.value;
      } catch {
        token = sbCookie.value;
      }
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to view candidate directory.' }, { status: 401 });
  }

  // 2. Authenticate Session via Supabase Cryptographic Verification
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
  }

  // 3. Verify Employer / Admin Role in Database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const callerRole = profile?.role || 'worker';
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
