import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function GET(req: NextRequest) {
  // Require bearer token — no query-param identity lookup (security hardening)
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
    return NextResponse.json({ error: 'Unauthorized', message: 'Bearer token required.' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Identity is derived exclusively from auth.uid() — never from query params
    const userId = user.id;

    const r = await queryDb(`SELECT * FROM public.profiles WHERE id = $1 LIMIT 1`, [userId]);
    const profile = r?.rows[0] || null;

    let workerProfile = null;
    let employerProfile = null;

    const wpRes = await queryDb(
      `SELECT * FROM public.worker_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
      [userId]
    ).catch(() => null);
    if (wpRes?.rows?.[0]) workerProfile = wpRes.rows[0];

    const epRes = await queryDb(
      `SELECT * FROM public.employer_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
      [userId]
    ).catch(() => null);
    if (epRes?.rows?.[0]) employerProfile = epRes.rows[0];

    return NextResponse.json({
      success: true,
      user: profile ? {
        id: profile.id,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        status: profile.status,
      } : null,
      workerProfile: workerProfile ? {
        id: workerProfile.id,
        user_id: workerProfile.user_id,
        full_name: workerProfile.full_name,
        name: workerProfile.name,
        gender: workerProfile.gender,
        age: workerProfile.age,
        experience_years: workerProfile.experience_years,
        expected_salary: workerProfile.expected_salary,
        skills: workerProfile.skills,
        languages_spoken: workerProfile.languages_spoken,
        primary_gated_society: workerProfile.primary_gated_society,
        preferred_society_name: workerProfile.preferred_society_name,
        preferred_shift: workerProfile.preferred_shift,
        avatar_url: workerProfile.avatar_url,
        profile_picture_url: workerProfile.profile_picture_url,
        is_aadhaar_verified: workerProfile.is_aadhaar_verified,
        is_tele_onboarded: workerProfile.is_tele_onboarded,
        status: workerProfile.status,
      } : null,
      employerProfile: employerProfile ? {
        id: employerProfile.id,
        user_id: employerProfile.user_id,
        name: employerProfile.name,
        company_name: employerProfile.company_name,
        society_name: employerProfile.society_name,
        tower_block: employerProfile.tower_block,
        address: employerProfile.address,
        city: employerProfile.city,
        state: employerProfile.state,
        avatar_url: employerProfile.avatar_url,
        subscription_status: employerProfile.subscription_status,
        status: employerProfile.status,
      } : null,
      profileFound: !!profile,
    });
  } catch (err: any) {
    console.error('[api/auth/me] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
