import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    let userId: string | null = null;
    if (token && token.length > 20) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const reqUserId = searchParams.get('userId') || userId;

    let sql = `
      SELECT 
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
    `;

    const params: any[] = [];
    if (reqUserId) {
      params.push(reqUserId);
      sql += ` WHERE j.employer_id::text = $${params.length}`;
    }

    sql += ` GROUP BY j.id ORDER BY j.created_at DESC LIMIT $${limit}`;

    const result = await queryDb(sql, params);

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
