import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to apply for job.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const workerId = user.id;
    const body = await req.json().catch(() => ({}));
    const { jobId } = body;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Bad Request', message: 'jobId is required.' }, { status: 400 });
    }

    // Check if already applied
    const existingApp = await queryDb(
      `SELECT id FROM public.job_applications WHERE job_id = $1 AND worker_id = $2 LIMIT 1`,
      [jobId, workerId]
    );

    if (existingApp?.rows?.length) {
      return NextResponse.json({
        success: true,
        alreadyApplied: true,
        message: 'You have already applied for this job.'
      });
    }

    // Insert job application
    const insertRes = await queryDb(
      `INSERT INTO public.job_applications (job_id, worker_id, status, created_at)
       VALUES ($1, $2, 'applied', NOW())
       RETURNING *`,
      [jobId, workerId]
    );

    return NextResponse.json({
      success: true,
      message: 'Job application submitted successfully.',
      application: insertRes?.rows?.[0] || null
    }, { status: 201 });
  } catch (err: any) {
    console.error('[worker/apply] POST error:', err?.message);
    return NextResponse.json({ error: 'Server Error', message: err?.message || 'Failed to submit application.' }, { status: 500 });
  }
}
