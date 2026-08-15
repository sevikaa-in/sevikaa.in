import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { getCached, setCached } from '@/lib/ttlCache';
import { checkRateLimitCritical, checkRateLimitAsync, extractClientIp } from '@/lib/rateLimiter';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SOCIETIES_CACHE_KEY = 'platform:societies_list';

export async function GET() {
  try {
    // 1. Check TTL cache to eliminate redundant DB query egress
    const cachedSocieties = getCached<any[]>(SOCIETIES_CACHE_KEY);
    if (cachedSocieties) {
      return NextResponse.json({ success: true, societies: cachedSocieties, cached: true });
    }

    // 2. Direct DB Query — active_jobs_count and employers_count are ALWAYS real DB values.
    //    If the query fails, we do NOT substitute fabricated counts.
    let societies: any[] | null = null;

    try {
      const dbRes = await queryDb(`
        SELECT
          s.id,
          s.name,
          s.city,
          s.latitude,
          s.longitude,
          s.created_at,
          COALESCE((
            SELECT COUNT(*)
            FROM public.jobs j
            WHERE j.status IN ('pending', 'approved')
              AND j.society_id = s.id
          ), 0) AS active_jobs_count,
          COALESCE((
            SELECT COUNT(*)
            FROM public.employer_profiles ep
            WHERE ep.society_name IS NOT NULL
              AND (ep.society_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', ep.society_name, '%'))
          ), 0) AS employers_count
        FROM public.societies s
        ORDER BY s.name ASC
      `);

      if (dbRes?.rows?.length) {
        societies = dbRes.rows.map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city || 'Bangalore',
          state: null,
          pincode: null,
          total_flats: null,
          latitude: row.latitude ? parseFloat(row.latitude) : null,
          longitude: row.longitude ? parseFloat(row.longitude) : null,
          // Real DB counts — never fabricated
          active_jobs_count: parseInt(row.active_jobs_count || '0', 10),
          employers_count: parseInt(row.employers_count || '0', 10),
          created_at: row.created_at
        }));
      } else {
        // DB returned empty (no societies exist) — return genuine empty list, not fake data
        societies = [];
      }
    } catch (dbErr) {
      console.error('[GET /api/societies] DB query failed:', dbErr);
      // DB unavailable — do NOT fabricate metrics. Return cached if available; otherwise 503.
      const stale = getCached<any[]>(SOCIETIES_CACHE_KEY);
      if (stale) {
        return NextResponse.json({ success: true, societies: stale, cached: true, stale: true });
      }
      return NextResponse.json(
        { success: false, error: 'Database temporarily unavailable. Please retry.' },
        { status: 503 }
      );
    }

    // Cache real results for 5 minutes (300 seconds)
    if (societies.length > 0) {
      setCached(SOCIETIES_CACHE_KEY, societies, 300);
    }

    return NextResponse.json({ success: true, societies });
  } catch (err: any) {
    console.error('[GET /api/societies] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/societies — Submit a society onboarding request.
 *
 * Security flow:
 *   Bearer token → verify authenticated user → verify worker/employer role
 *   → distributed rate limit → validate input → insert pending society
 *
 * Unauthenticated  → 401
 * Unauthorized role → 403
 * Rate limit        → 429
 * Rate limiter down → 503
 * Invalid input     → 400
 */
export async function POST(req: NextRequest) {
  // 1. Extract Bearer token
  const authHeader = req.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    const sbCookie = Array.from(req.cookies.getAll()).find(c =>
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
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required to submit a society request.' },
      { status: 401 }
    );
  }

  // 2. Verify token and resolve identity
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired session token.' },
      { status: 401 }
    );
  }

  const userId = user.id;

  // 3. Verify role — restricted exclusively to 'worker' role (least privilege)
  let callerRole: string | null = null;
  try {
    const profileRes = await queryDb(
      `SELECT role FROM public.profiles WHERE id = $1 LIMIT 1`,
      [userId]
    );
    callerRole = profileRes?.rows?.[0]?.role || null;
  } catch (err) {
    console.error('[POST /api/societies] Profile lookup failed:', err);
    return NextResponse.json(
      { error: 'Server error', message: 'Failed to verify account.' },
      { status: 500 }
    );
  }

  if (callerRole !== 'worker') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Only worker accounts are permitted to submit society requests.' },
      { status: 403 }
    );
  }

  // 4. Rate limit — CRITICAL endpoint requirement: fail closed with 503 if Redis is unavailable
  const rateLimit = await checkRateLimitCritical(`societies-post:${extractClientIp(req)}`, 5, 60000);
  if (rateLimit.unavailable) {
    return NextResponse.json(
      { error: 'Rate limiting service temporarily unavailable.' },
      { status: 503 }
    );
  }
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests', message: 'Too many society requests. Please wait before trying again.' },
      { status: 429 }
    );
  }

  // 5. Validate input
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { name, area, city } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Society name is required.' },
      { status: 400 }
    );
  }

  if (name.trim().length > 200) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Society name must be 200 characters or fewer.' },
      { status: 400 }
    );
  }

  // 6. Insert pending society request
  try {
    const insertRes = await queryDb(
      `INSERT INTO public.societies (name, area, city, status, created_at)
       VALUES ($1, $2, $3, 'pending_verification', NOW())
       RETURNING id, name, status, created_at`,
      [name.trim(), (area || '').trim() || 'Bengaluru', (city || '').trim() || 'Bengaluru']
    );

    return NextResponse.json({
      success: true,
      message: 'Society request submitted for verification.',
      society: insertRes?.rows?.[0] || null
    }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/societies] Insert failed:', err?.message);
    return NextResponse.json(
      { error: 'Server Error', message: 'Failed to submit society request. Please try again.' },
      { status: 500 }
    );
  }
}
