import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
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

    const result = await queryDb(
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
