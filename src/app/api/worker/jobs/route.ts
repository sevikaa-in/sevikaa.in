import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/repositories/jobRepository';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
    const category = searchParams.get('category');
    const societyId = searchParams.get('society_id') || searchParams.get('societyId');

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
        ep.company_name AS employer_name
      FROM public.jobs j
      LEFT JOIN public.employer_profiles ep ON ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text
      WHERE j.status = 'active' OR j.status = 'open' OR j.status = 'live'
    `;

    const params: any[] = [];
    if (category) {
      params.push(category);
      sql += ` AND LOWER(j.category) = LOWER($${params.length})`;
    }

    if (societyId) {
      params.push(societyId);
      sql += ` AND j.society_id::text = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY j.created_at DESC LIMIT $${params.length}`;

    const result = await queryDb(sql, params);

    return NextResponse.json({
      success: true,
      jobs: result?.rows || [],
      count: result?.rows?.length || 0
    });
  } catch (err: any) {
    console.error("Worker jobs API error:", err);
    return NextResponse.json({ error: err.message || 'Failed to fetch jobs' }, { status: 500 });
  }
}
