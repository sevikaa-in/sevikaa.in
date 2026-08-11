import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  // Item 27: Rate limit match endpoint (primary egress generator)
  const rateLimit = checkRateLimit(request, 30, 60000); // 30 req/min per IP
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait before searching again.' }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const { searchParams } = new URL(request.url);
  const societyId = searchParams.get('societyId');
  const category = searchParams.get('category') || 'maid';
  const maxSalary = searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : null;

  if (!societyId) {
    return NextResponse.json({ error: 'societyId query parameter is required' }, { status: 400 });
  }

  const { supabaseAdmin } = await import('@/lib/supabaseAdminClient');

  try {
    const { data: rpcWorkers, error: queryErr } = await supabaseAdmin.rpc('search_workers', {
      p_society_id: societyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? societyId : null,
      p_category: category,
      p_max_salary: maxSalary,
      p_limit: 20
    });

    // P0: RPC failure returns empty results — never SELECT *
    if (queryErr || !rpcWorkers) {
      console.error('[match] search_workers RPC failed:', queryErr?.message || 'null result');
      // Item 26: Never expose internal RPC error detail to clients
      return NextResponse.json({
        results: [],
        error: 'Worker search temporarily unavailable. Please try again.',
      }, { status: 200 });
    }

    const results = rpcWorkers.map((w: any) => ({
      user_id: w.user_id || w.id,
      full_name: w.full_name || 'Domestic Helper',
      gender: w.gender || 'female',
      age: w.age || 28,
      skills: w.skills || [category],
      languages_spoken: w.languages_spoken || ['Hindi'],
      expected_salary: w.expected_salary || 12000,
      preferred_society_id: w.preferred_society_id || societyId,
      preferred_society_name: w.preferred_society_name || 'Gated Society',
      approximate_distance: w.preferred_society_id === societyId ? 0.0 : 1.5,
      is_aadhaar_verified: Boolean(w.is_aadhaar_verified),
      is_police_verified: Boolean(w.is_police_verified),
      is_interview_verified: Boolean(w.is_interview_verified),
      average_rating: w.rating || 4.8,
      profile_picture_url: w.profile_picture_url,
      experience_years: w.experience_years,
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('[match] Unexpected error:', err);
    return NextResponse.json({ results: [], error: 'Service temporarily unavailable.' }, { status: 200 });
  }
}
