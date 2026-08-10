import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const { searchParams } = new URL(request.url);
  const societyId = searchParams.get('societyId');
  const category = searchParams.get('category') || 'maid';
  const maxSalary = searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : null;

  if (!societyId) {
    return NextResponse.json({ error: 'societyId query parameter is required' }, { status: 400 });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: rpcWorkers, error: queryErr } = await supabaseClient.rpc('search_workers', {
      p_society_id: societyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? societyId : null,
      p_category: category,
      p_max_salary: maxSalary,
      p_limit: 20
    });

    if (queryErr || !rpcWorkers) {
      // Fallback query if RPC call unavailable
      let fallbackQuery = supabaseClient.from('worker_profiles').select('*');
      if (maxSalary) fallbackQuery = fallbackQuery.lte('expected_salary', maxSalary);
      const { data: fallbackData } = await fallbackQuery;

      const results = (fallbackData || [])
        .filter((w: any) => Array.isArray(w.skills) && w.skills.some((s: string) => s.toLowerCase() === category.toLowerCase()))
        .map((w: any) => ({
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
          average_rating: w.rating || 4.8
        }));

      return NextResponse.json({ results });
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
      is_interview_verified: Boolean(w.is_tele_onboarded),
      average_rating: w.rating || 4.8
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ results: [] });
  }
}
