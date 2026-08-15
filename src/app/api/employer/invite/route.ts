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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to send candidate invitations.' }, { status: 401 });
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
    const { jobId, workerIds } = body;

    if (!jobId || !Array.isArray(workerIds) || workerIds.length === 0) {
      return NextResponse.json({ error: 'Bad Request', message: 'jobId and workerIds array are required.' }, { status: 400 });
    }

    // Insert invitations via server query
    let invitedCount = 0;
    for (const wId of workerIds) {
      try {
        await queryDb(
          `INSERT INTO public.applications (employer_id, job_id, worker_id, status, admin_note, created_at)
           VALUES ($1, $2, $3, 'invited', 'Mass Job Invitation dispatched by Employer via Mobile', NOW())`,
          [employerId, String(jobId), String(wId)]
        );
        invitedCount++;
      } catch (err) {
        // Continue loop for other candidates
      }
    }

    return NextResponse.json({
      success: true,
      message: `Mass Job Invitation sent to ${invitedCount} candidate(s).`,
      count: invitedCount
    }, { status: 201 });
  } catch (err: any) {
    console.error('[employer/invite] POST error:', err?.message);
    return NextResponse.json({ error: 'Server Error', message: err?.message || 'Failed to send candidate invitations.' }, { status: 500 });
  }
}
