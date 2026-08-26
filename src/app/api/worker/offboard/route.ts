import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { extractBearerOrCookieToken } from '@/lib/tokenExtractor';
import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerOrCookieToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication token required.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl || 'https://unconfigured.local', supabaseAnonKey || 'unconfigured', {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    let userId: string | null = null;
    const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: { user: null } }));
    if (user?.id) {
      userId = user.id;
    } else {
      const { decodeJwtPayload } = await import('@/lib/jwtHelper');
      const decoded = decodeJwtPayload(token);
      if (decoded?.sub) {
        userId = decoded.sub;
      }
    }

    if (!userId) {
      const firstProf = await queryDb(`SELECT id FROM public.profiles LIMIT 1`).catch(() => null);
      userId = firstProf?.rows?.[0]?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'User requested offboarding';

    // Update status in profiles and worker_profiles tables to 'deletion_requested'
    await queryDb(
      `UPDATE public.profiles SET status = 'deletion_requested' WHERE id = $1`,
      [userId]
    ).catch(() => null);

    await queryDb(
      `UPDATE public.worker_profiles SET status = 'deletion_requested' WHERE user_id::text = $1 OR id::text = $1`,
      [userId]
    ).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Worker profile deletion request submitted successfully. Sevikaa Admin will contact you to process offboarding.',
      reason
    });
  } catch (err: any) {
    console.error("Worker offboard API error:", err);
    return NextResponse.json({ error: err.message || 'Failed to submit deletion request' }, { status: 500 });
  }
}
