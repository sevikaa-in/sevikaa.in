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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to schedule interviews.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const employerId = user.id;
    const body = await req.json().catch(() => ({}));
    const { workerId, date, time } = body;

    if (!workerId || typeof workerId !== 'string') {
      return NextResponse.json({ error: 'Bad Request', message: 'workerId is required.' }, { status: 400 });
    }

    // Insert interview into database via server query
    const insertRes = await queryDb(
      `INSERT INTO public.interviews (employer_id, worker_id, date, time, status, created_at)
       VALUES ($1, $2, $3, $4, 'scheduled', NOW())
       RETURNING *`,
      [employerId, workerId, date || 'Tomorrow', time || '10:00 AM']
    );

    return NextResponse.json({
      success: true,
      message: 'Interview gate pass scheduled successfully.',
      interview: insertRes?.rows?.[0] || null
    }, { status: 201 });
  } catch (err: any) {
    console.error('[employer/interview] POST error:', err?.message);
    return NextResponse.json({ error: 'Server Error', message: err?.message || 'Failed to schedule interview.' }, { status: 500 });
  }
}
