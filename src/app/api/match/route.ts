import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Mock matched worker profiles for local demo/tests when Supabase is unconfigured
const MOCK_MATCHED_WORKERS = [
  {
    user_id: 'worker-uuid-1',
    full_name: 'Kamla Devi',
    gender: 'female',
    age: 34,
    skills: ['maid'],
    languages_spoken: ['Hindi', 'Hinglish'],
    expected_salary: 8000,
    preferred_society_id: '1', // Same society mock
    preferred_society_name: 'Prestige Shantiniketan, Whitefield',
    approximate_distance: 0.0, // Same society!
    is_aadhaar_verified: true,
    is_police_verified: true,
    is_interview_verified: true,
    average_rating: 4.8
  },
  {
    user_id: 'worker-uuid-2',
    full_name: 'Rani Kumari',
    gender: 'female',
    age: 28,
    skills: ['maid', 'cook'],
    languages_spoken: ['Hindi', 'Assamese'],
    expected_salary: 10000,
    preferred_society_id: '2', // Nearby society mock
    preferred_society_name: 'Prestige Lakeside Habitat, Varthur',
    approximate_distance: 1.2, // 1.2 km away
    is_aadhaar_verified: true,
    is_police_verified: false,
    is_interview_verified: true,
    average_rating: 4.5
  },
  {
    user_id: 'worker-uuid-3',
    full_name: 'Laxmi Shrestha',
    gender: 'female',
    age: 40,
    skills: ['cook', 'nanny'],
    languages_spoken: ['Hindi', 'Nepali'],
    expected_salary: 14000,
    preferred_society_id: '3',
    preferred_society_name: 'Sobha Jasmine, Bellandur',
    approximate_distance: 3.4, // Farther away
    is_aadhaar_verified: true,
    is_police_verified: false,
    is_interview_verified: false,
    average_rating: 4.0
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const societyId = searchParams.get('societyId');
  const category = searchParams.get('category') || 'maid';
  const maxSalary = searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : null;

  if (!societyId) {
    return NextResponse.json({ error: 'societyId query parameter is required' }, { status: 400 });
  }

  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');

  if (isPlaceholder) {
    // Return mock matching data filtered locally
    let results = MOCK_MATCHED_WORKERS.filter(w => w.skills.includes(category));
    
    // Sort according to priority: Same society first (distance = 0.0), then distance, then salary
    results = results.sort((a, b) => {
      // 1. Same society comparison
      const aSame = a.preferred_society_id === societyId ? 1 : 0;
      const bSame = b.preferred_society_id === societyId ? 1 : 0;
      if (aSame !== bSame) return bSame - aSame;
      
      // 2. Distance sorting
      return a.approximate_distance - b.approximate_distance;
    });

    if (maxSalary) {
      results = results.filter(w => w.expected_salary <= maxSalary);
    }

    return NextResponse.json({ results });
  }

  // Live Supabase RPC call
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabaseClient.rpc('search_workers', {
      p_job_society_id: societyId,
      p_category: category,
      p_max_salary: maxSalary
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return results safely. The RPC automatically masks coordinates by only outputting approximate_distance
    return NextResponse.json({ results: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error during matching query' }, { status: 500 });
  }
}
