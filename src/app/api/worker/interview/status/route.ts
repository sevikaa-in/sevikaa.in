import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;

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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to update interview status.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { applicationId, status, rescheduleTime, rescheduleNote } = body;

    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'Bad Request', message: 'applicationId is required.' }, { status: 400 });
    }

    const updateRes = await queryDb(
      `UPDATE public.applications 
       SET status = COALESCE($1, status),
           reschedule_time = COALESCE($2, reschedule_time),
           reschedule_note = COALESCE($3, reschedule_note),
           updated_at = NOW()
       WHERE id::text = $4 AND (worker_id::text = $5 OR employer_id::text = $5)
       RETURNING *`,
      [status || 'confirmed', rescheduleTime || null, rescheduleNote || null, applicationId, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Interview status updated successfully.',
      application: updateRes?.rows?.[0] || null
    });
  } catch (err: any) {
    console.error('[worker/interview/status] POST error:', err?.message);
    return NextResponse.json({ error: 'Server Error', message: err?.message || 'Failed to update interview status.' }, { status: 500 });
  }
}
