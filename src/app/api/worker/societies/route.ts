import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /api/worker/societies
 *
 * Authenticated endpoint for the WorkerSocietiesScreen.
 * Returns in a single response:
 *   - All societies with server-computed active_jobs_count and employers_count
 *   - The authenticated worker's primary society ID / name
 *   - The authenticated worker's secondary society names
 *
 * Active job counts are calculated on the server — the Mobile client
 * never receives or processes the jobs table.
 *
 * Authorization: Bearer token required. Identity is always derived from
 * the verified JWT via supabase.auth.getUser(), never from query params.
 */
export async function GET(req: NextRequest) {
  // 1. Rate limit (CRITICAL: fail-closed, no in-memory fallback)
  const rateLimit = await checkRateLimitCritical(extractClientIp(req), 60, 60000);
  if (rateLimit.unavailable) {
    return NextResponse.json(
      { error: 'Rate limiting service temporarily unavailable.' },
      { status: 503 }
    );
  }
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // 2. Extract Bearer token
  const authHeader = req.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    // Mobile also accepts Supabase HttpOnly auth cookies (belt-and-suspenders)
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
      { error: 'Unauthorized', message: 'Bearer token required.' },
      { status: 401 }
    );
  }

  // 3. Verify token — identity derived exclusively from auth.uid()
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

  try {
    // 4. Fetch worker's society context (primary + secondary assignments)
    //    Columns guaranteed by migration 20260810000001_production_performance_and_security.sql
    const workerCtxRes = await queryDb(
      `SELECT
         preferred_society_id,
         preferred_society_name,
         secondary_society_name,
         preferred_areas
       FROM public.worker_profiles
       WHERE user_id::text = $1 OR id::text = $1
       LIMIT 1`,
      [userId]
    ).catch(() => null);

    const wp = workerCtxRes?.rows?.[0] ?? null;

    const primarySocietyId: string | null = wp?.preferred_society_id
      ? String(wp.preferred_society_id)
      : null;

    const primarySocietyName: string | null = wp?.preferred_society_name
      ? String(wp.preferred_society_name).trim() || null
      : null;

    // secondary_society_name is stored as a comma-separated text column
    let secondarySocietyNames: string[] = [];
    if (wp?.secondary_society_name && String(wp.secondary_society_name).trim()) {
      secondarySocietyNames = String(wp.secondary_society_name)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(wp?.preferred_areas) && wp.preferred_areas.length > 1) {
      // Fallback: use preferred_areas[1..] if secondary_society_name is not set
      secondarySocietyNames = (wp.preferred_areas as string[]).slice(1).filter(Boolean);
    }

    // Remove duplicates and strip the primary name from secondary list
    const primaryLower = (primarySocietyName || '').toLowerCase().trim();
    secondarySocietyNames = [
      ...new Set(
        secondarySocietyNames.filter(
          s => s.toLowerCase().trim() !== primaryLower
        )
      )
    ];

    // 5. Fetch all societies with server-computed active job counts.
    //    Active jobs are defined as: status IS NULL OR status NOT IN ('closed', 'fulfilled', 'cancelled', 'deleted').
    //    The Mobile client NEVER receives jobs data — counts are computed in the DB.
    const societiesRes = await queryDb(`
      SELECT
        s.id,
        s.name,
        s.city,
        s.state,
        s.latitude,
        s.longitude,
        COALESCE((
          SELECT COUNT(*)
          FROM public.jobs j
          WHERE (j.status IS NULL OR j.status NOT IN ('closed', 'fulfilled', 'cancelled', 'deleted'))
            AND (
              j.society_id::text = s.id::text
              OR (
                j.society_name IS NOT NULL
                AND (
                  j.society_name ILIKE CONCAT('%', s.name, '%')
                  OR s.name ILIKE CONCAT('%', j.society_name, '%')
                )
              )
            )
        ), 0) AS active_jobs_count,
        COALESCE((
          SELECT COUNT(*)
          FROM public.employer_profiles ep
          WHERE ep.society_name IS NOT NULL
            AND (
              ep.society_name ILIKE CONCAT('%', s.name, '%')
              OR s.name ILIKE CONCAT('%', ep.society_name, '%')
            )
        ), 0) AS employers_count
      FROM public.societies s
      ORDER BY s.name ASC
    `);

    const societies = (societiesRes?.rows ?? []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      city: String(row.city || 'Bangalore'),
      state: String(row.state || 'Karnataka'),
      // area/pincode may not exist in base schema — omit rather than expose nulls
      latitude: parseFloat(row.latitude) || 12.9716,
      longitude: parseFloat(row.longitude) || 77.5946,
      // Security type is not yet a DB column; use a sensible default
      securityType: 'Physical Gate Security',
      activeJobsCount: parseInt(row.active_jobs_count || '0', 10),
      employersCount: parseInt(row.employers_count || '0', 10),
    }));

    return NextResponse.json({
      success: true,
      workerSocietyContext: {
        primarySocietyId,
        primarySocietyName,
        secondarySocietyNames,
      },
      societies,
    });
  } catch (err: any) {
    console.error('[api/worker/societies] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Server error', message: 'Failed to fetch societies.' },
      { status: 500 }
    );
  }
}
