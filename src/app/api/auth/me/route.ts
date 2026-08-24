import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req: NextRequest) {
  // Require bearer token — no query-param identity lookup (security hardening)
  const authHeader = req.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    // First check our own HttpOnly access token cookie (set on login & refresh)
    const sevikaaToken = req.cookies.get('sevikaa_access_token')?.value;
    if (sevikaaToken) {
      token = sevikaaToken;
    }
  }

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
    let userId: string | null = null;

    try {
      const supabase = createClient(supabaseUrl || 'https://unconfigured.local', supabaseAnonKey || 'unconfigured', {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: { user: null } }));
      if (user?.id) {
        userId = user.id;
      }
    } catch {}

    if (!userId) {
      try {
        const { decodeJwtPayload } = await import('@/lib/jwtHelper');
        const decoded = decodeJwtPayload(token);
        if (decoded?.sub) {
          userId = decoded.sub;
        }
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const r = await queryDb(
      `SELECT id, phone, email, role, status, full_name, created_at 
       FROM public.profiles WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const profile = r?.rows[0] || null;

    let workerProfile = null;
    let employerProfile = null;

    const wpRes = await queryDb(
      `SELECT id, user_id, full_name, name, gender, age, experience_years, expected_salary, skills, languages_spoken, primary_gated_society, preferred_society_name, secondary_society_name, preferred_society_id, preferred_areas, preferred_shift, bio, emergency_contact, avatar_url, profile_picture_url, aadhaar_front_url, aadhaar_back_url, video_url, police_verification_url, is_aadhaar_verified, is_police_verified, is_tele_onboarded, status
       FROM public.worker_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
      [userId]
    ).catch(() => null);
    if (wpRes?.rows?.[0]) workerProfile = wpRes.rows[0];

    const epRes = await queryDb(
      `SELECT id, user_id, name, company_name, society_name, tower_block, address, city, state, pincode, gstin, alternate_phone, verification_requirement, residency_proof_url, aadhaar_front_url, aadhaar_back_url, avatar_url, subscription_status, status
       FROM public.employer_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
      [userId]
    ).catch(() => null);
    if (epRes?.rows?.[0]) employerProfile = epRes.rows[0];

    const userPayload = profile ? {
      id: profile.id,
      phone: profile.phone,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      status: profile.status,
    } : null;

    return NextResponse.json({
      success: true,
      user: userPayload,
      profile: userPayload,
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
        secondary_society_name: workerProfile.secondary_society_name,
        preferred_society_id: workerProfile.preferred_society_id,
        preferred_areas: workerProfile.preferred_areas,
        preferred_shift: workerProfile.preferred_shift,
        bio: workerProfile.bio,
        emergency_contact: workerProfile.emergency_contact,
        avatar_url: workerProfile.avatar_url,
        profile_picture_url: workerProfile.profile_picture_url,
        aadhaar_front_url: workerProfile.aadhaar_front_url,
        aadhaar_back_url: workerProfile.aadhaar_back_url,
        video_url: workerProfile.video_url,
        police_verification_url: workerProfile.police_verification_url,
        is_aadhaar_verified: workerProfile.is_aadhaar_verified,
        is_police_verified: workerProfile.is_police_verified,
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
        pincode: employerProfile.pincode,
        gstin: employerProfile.gstin,
        alternate_phone: employerProfile.alternate_phone,
        verification_requirement: employerProfile.verification_requirement,
        residency_proof_url: employerProfile.residency_proof_url,
        aadhaar_front_url: employerProfile.aadhaar_front_url,
        aadhaar_back_url: employerProfile.aadhaar_back_url,
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
