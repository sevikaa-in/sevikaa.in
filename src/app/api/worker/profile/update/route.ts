import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Session — strictly require verified Bearer token (IDOR Fix - P0 #1)
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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication token required.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Authenticated user ID is canonical — never trust body.userId
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const { 
      name, full_name, phone, email, gender, age, 
      expectedSalary, experience, skills, languages, languages_spoken, bio, 
      emergencyContact, preferredShift, profile_picture_url, onboarding_step, status,
      aadhaar_front_url, aadhaar_back_url, video_url, police_verification_url
    } = body;

    const displayName = full_name || name || 'Worker';
    const expYears = Math.max(0, parseInt(experience) || 0);
    const parsedSalary = parseInt(expectedSalary);
    const salary = (parsedSalary && parsedSalary > 0) ? parsedSalary : 15000;
    const numAge = Math.max(18, Math.min(80, parseInt(age) || 28));
    let cleanGender = (gender || '').toLowerCase().trim();
    if (!['male', 'female', 'other'].includes(cleanGender)) {
      cleanGender = 'female';
    }

    // 2. Update public.profiles (only permitted fields)
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET full_name = CASE WHEN $1::text IS NOT NULL AND $1::text != '' THEN $1::text ELSE full_name END,
             phone = CASE WHEN $2::text IS NOT NULL AND $2::text != '' THEN $2::text ELSE phone END,
             email = CASE WHEN $3::text IS NOT NULL AND $3::text != '' THEN $3::text ELSE email END,
             updated_at = NOW()
         WHERE id = $4`,
        [displayName, phone || null, email || null, userId]
      );
    } catch (pErr) {
      console.warn("Worker profiles base table update warning:", pErr);
    }

    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);
    const langsArr = Array.isArray(languages_spoken || languages) 
      ? (languages_spoken || languages) 
      : ((languages_spoken || languages) ? [languages_spoken || languages] : ['Hindi']);

    const primarySoc = body.primary_gated_society || body.primary_society_name || body.society || '';
    const secondarySoc = body.secondary_gated_society || body.secondary_society_name || body.secondary_society || '';
    
    const prefAreas = Array.isArray(body.preferred_areas) && body.preferred_areas.length > 0
      ? body.preferred_areas 
      : [primarySoc, secondarySoc].filter(Boolean);

    // 3. Direct PostgreSQL update with queryDb
    try {
      const checkRes = await queryDb(
        `SELECT id FROM public.worker_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`, 
        [userId]
      );

      const workerBio = body.bio || null;
      let workerShift = body.preferred_shift || body.preferredShift || null;
      if (!workerShift && Array.isArray(body.selectedShifts) && body.selectedShifts.length > 0) {
        const SHIFT_MAP: Record<string, string> = {
          full_day: 'Full Day (8–12 Hours)',
          early_morning: 'Early Morning (6 AM – 9 AM)',
          morning: 'Morning Shift (9 AM – 12 PM)',
          afternoon: 'Afternoon Shift (12 PM – 3 PM)',
          evening: 'Evening Shift (3 PM – 6 PM)',
          night: 'Night Shift (6 PM – 9 PM)',
          live_in: 'Live-In (24x7)',
          part_time: 'Part-Time Flexible'
        };
        workerShift = body.selectedShifts.map((s: string) => SHIFT_MAP[s] || s).join(', ');
      }

      const rawAltDigits = (body.alternate_phone || body.alt_phone || body.emergencyContact || body.emergency_contact || '').replace(/\D/g, '');
      const workerEmergency = rawAltDigits.length === 10 ? `+91 ${rawAltDigits}` : (body.alternate_phone || body.alt_phone || body.emergencyContact || body.emergency_contact || null);
      const pSoc = primarySoc || null;
      const sSoc = secondarySoc || null;

      let pSocId: string | null = null;
      if (pSoc) {
        try {
          const socRes = await queryDb(`SELECT id FROM public.societies WHERE LOWER(name) = LOWER($1) LIMIT 1`, [pSoc]);
          if (socRes?.rows && socRes.rows.length > 0) {
            pSocId = socRes.rows[0].id;
          }
        } catch (sErr) {
          console.warn("Society lookup notice:", sErr);
        }
      }

      if (checkRes && checkRes.rows.length > 0) {
        // Document submission does NOT auto-verify Aadhaar (Item 13 Fix)
        // Aadhaar verification flag is updated strictly by admin audit
        await queryDb(
          `UPDATE public.worker_profiles 
           SET full_name = CASE WHEN $1::text IS NOT NULL AND $1::text != '' AND $1::text != 'Worker' THEN $1::text ELSE full_name END, 
               gender = COALESCE($2::text, gender), 
               age = COALESCE($3::integer, age), 
               expected_salary = COALESCE($4::integer, expected_salary), 
               experience_years = COALESCE($5::integer, experience_years),
               skills = COALESCE($6::text[], skills),
               languages_spoken = COALESCE($7::text[], languages_spoken),
               profile_picture_url = CASE WHEN $8::text IS NOT NULL AND $8::text != '' THEN $8::text ELSE profile_picture_url END,
               aadhaar_front_url = CASE WHEN $9::text IS NOT NULL AND $9::text != '' THEN $9::text ELSE aadhaar_front_url END,
               aadhaar_back_url = CASE WHEN $10::text IS NOT NULL AND $10::text != '' THEN $10::text ELSE aadhaar_back_url END,
               video_url = CASE WHEN $11::text IS NOT NULL AND $11::text != '' THEN $11::text ELSE video_url END,
               police_verification_url = CASE WHEN $12::text IS NOT NULL AND $12::text != '' THEN $12::text ELSE police_verification_url END,
               preferred_areas = CASE WHEN $13::text[] IS NOT NULL AND array_length($13::text[], 1) > 0 THEN $13::text[] ELSE preferred_areas END,
               bio = CASE WHEN $15::text IS NOT NULL AND $15::text != '' THEN $15::text ELSE bio END,
               preferred_shift = CASE WHEN $16::text IS NOT NULL AND $16::text != '' THEN $16::text ELSE preferred_shift END,
               emergency_contact = CASE WHEN $17::text IS NOT NULL AND $17::text != '' THEN $17::text ELSE emergency_contact END,
               alternate_phone = CASE WHEN $17::text IS NOT NULL AND $17::text != '' THEN $17::text ELSE alternate_phone END,
               alt_phone = CASE WHEN $17::text IS NOT NULL AND $17::text != '' THEN $17::text ELSE alt_phone END,
               preferred_society_name = CASE WHEN $18::text IS NOT NULL AND $18::text != '' THEN $18::text ELSE preferred_society_name END,
               secondary_society_name = CASE WHEN $19::text IS NOT NULL AND $19::text != '' THEN $19::text ELSE secondary_society_name END,
               preferred_society_id = CASE WHEN $20::text IS NOT NULL AND $20::text != '' AND $20::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $20::uuid ELSE preferred_society_id END
           WHERE user_id::text = $14 OR id::text = $14`,
          [displayName, cleanGender, numAge, salary, expYears, 
           skillsArr.length ? skillsArr : null, langsArr.length ? langsArr : null, 
           profile_picture_url || null, aadhaar_front_url || null, aadhaar_back_url || null,
           video_url || null, police_verification_url || null, prefAreas, userId, workerBio, workerShift, workerEmergency, pSoc, sSoc, pSocId]
        );
      } else {
        await queryDb(
          `INSERT INTO public.worker_profiles 
             (id, user_id, full_name, gender, age, expected_salary, experience_years, skills, languages_spoken, profile_picture_url, aadhaar_front_url, aadhaar_back_url, video_url, police_verification_url, preferred_areas, bio, preferred_shift, emergency_contact, alternate_phone, alt_phone, preferred_society_name, secondary_society_name, preferred_society_id, created_at)
           VALUES 
             (gen_random_uuid(), CASE WHEN $14 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $14::uuid ELSE gen_random_uuid() END, $1::text, $2::text, $3::integer, $4::integer, $5::integer, $6::text[], $7::text[], $8::text, $9::text, $10::text, $11::text, $12::text, $13::text[], $15::text, $16::text, $17::text, $17::text, $17::text, $18::text, $19::text, CASE WHEN $20::text IS NOT NULL AND $20::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $20::uuid ELSE NULL END, NOW())`,
          [displayName, cleanGender, numAge, salary, expYears, 
           skillsArr.length ? skillsArr : null, langsArr.length ? langsArr : null, 
           profile_picture_url || null, aadhaar_front_url || null, aadhaar_back_url || null,
           video_url || null, police_verification_url || null, prefAreas, userId, workerBio, workerShift, workerEmergency, pSoc, sSoc, pSocId]
        );
      }
    } catch (dbErr) {
      console.warn("Direct DB worker_profiles update warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Worker profile updated successfully.',
      userId
    });
  } catch (err: any) {
    console.error("POST /api/worker/profile/update error:", err);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
