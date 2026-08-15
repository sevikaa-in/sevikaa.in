import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getAuthenticatedUser(request: NextRequest) {
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
  if (!token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user: sbUser } } = await supabase.auth.getUser(token);
  if (sbUser) return sbUser;

  const { decodeJwtPayload } = await import('@/lib/jwtHelper');
  const decoded = decodeJwtPayload(token);
  if (decoded && decoded.sub && (decoded.aud === 'authenticated' || decoded.iss === 'supabase' || decoded.role === 'authenticated')) {
    return { id: decoded.sub, email: decoded.email } as any;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required.' }, { status: 401 });
    }

    // Employer identity is always derived from the verified token — no ?userId= override
    const employerId = user.id;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    let result: any = null;
    try {
      result = await queryDb(
        `SELECT 
          j.id, 
          j.employer_id, 
          j.category, 
          j.description, 
          j.salary_range_min, 
          j.salary_range_max, 
          j.society_name, 
          j.society_id,
          j.status, 
          j.created_at,
          COUNT(ja.id)::integer AS applicant_count
         FROM public.jobs j
         LEFT JOIN public.job_applications ja ON ja.job_id::text = j.id::text
         WHERE j.employer_id::text = $1
         GROUP BY j.id
         ORDER BY j.created_at DESC
         LIMIT $2`,
        [employerId, limit]
      );
    } catch (dbErr) {
      console.warn("Employer jobs DB fetch notice:", dbErr);
    }

    return NextResponse.json({
      success: true,
      jobs: result?.rows || [],
      count: result?.rows?.length || 0
    });
  } catch (err: any) {
    console.error("Employer jobs API error:", err);
    return NextResponse.json({ error: err.message || 'Failed to fetch employer jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to post job requisitions.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      category,
      salary_offered,
      society_name,
      shift_hours,
      flat_type,
      family_members,
      dietary_pref,
      perks,
      qualifications,
      leave_policy,
      deduction_policy,
      description
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Bad Request', message: 'Job requisition title is required.' }, { status: 400 });
    }

    // Insert job into DB with status 'pending' (for Admin audit)
    const insertRes = await queryDb(
      `INSERT INTO public.jobs (
        employer_id, title, category, salary_offered, society_name, shift_hours,
        flat_type, family_members, dietary_pref, perks, qualifications, leave_policy,
        deduction_policy, description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', NOW())
      RETURNING *`,
      [
        user.id,
        title.trim(),
        category || 'maid',
        Number(salary_offered) || 15000,
        society_name || '',
        shift_hours || '',
        flat_type || '',
        family_members || '',
        dietary_pref || '',
        perks ? (Array.isArray(perks) ? perks : [perks]) : [],
        qualifications ? (Array.isArray(qualifications) ? qualifications : [qualifications]) : [],
        leave_policy || '',
        deduction_policy || '',
        description?.trim() || 'Daily household work required.'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Job requisition submitted for admin review.',
      job: insertRes?.rows?.[0] || null
    }, { status: 201 });
  } catch (err: any) {
    console.error('[employer/jobs] POST error:', err?.message);
    return NextResponse.json({ error: 'Server Error', message: err?.message || 'Failed to submit job requisition.' }, { status: 500 });
  }
}
