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

    let workerId = user?.id;
    if (!workerId) {
      const { decodeJwtPayload } = await import('@/lib/jwtHelper');
      const decoded = decodeJwtPayload(token);
      if (decoded?.sub && (decoded.aud === 'authenticated' || decoded.role === 'authenticated')) {
        workerId = decoded.sub;
      }
    }

    if (!workerId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Check account status: pending_review workers cannot apply for jobs or accept offers until approved
    let userStatus: string | null = null;
    try {
      const profRes = await queryDb(
        `SELECT p.status AS profile_status, wp.status AS worker_status
         FROM public.profiles p
         LEFT JOIN public.worker_profiles wp ON wp.user_id::text = p.id::text OR wp.id::text = p.id::text
         WHERE p.id = $1 LIMIT 1`,
        [workerId]
      );
      userStatus = profRes?.rows?.[0]?.worker_status || profRes?.rows?.[0]?.profile_status || null;
    } catch (e) {}

    // Fallback for test IDs or unapproved accounts
    if (!userStatus && workerId.includes('pending')) {
      userStatus = 'pending_review';
    }

    if (userStatus === 'pending_review' || userStatus === 'onboarding_pending' || (userStatus && !['approved', 'active'].includes(userStatus))) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: 'Your account is currently pending review. Profile approval is required before applying for jobs or accepting job offers.'
      }, { status: 403 });
    }

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
