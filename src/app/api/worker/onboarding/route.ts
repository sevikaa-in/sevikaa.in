import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session — derive userId strictly from verified bearer token (IDOR Fix)
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
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Authentication required for onboarding.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Authenticated user ID is canonical — never trust body.userId / body.id
    const activeUserId = user.id;

    const body = await req.json().catch(() => ({}));
    const {
      full_name, name, phone,
      gender, age,
      experience_years, experience,
      expected_salary, salary,
      skills, category,
      languages_spoken, languages,
      primary_gated_society, society, society_id,
      preferred_shift, shift_hours,
      aadhaar_front_url, aadhaar_back_url, avatar_url, profile_picture_url
    } = body;

    const displayName = full_name || name || 'Worker Candidate';
    const cleanPhoneDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const formattedPhone = cleanPhoneDigits ? `+91${cleanPhoneDigits}` : phone;
    const finalGender = gender || 'female';
    const finalAge = parseInt(age) || 28;
    const finalExp = parseInt(experience_years || experience) || 0;
    const finalSalary = parseInt(expected_salary || salary) || 15000;
    const finalSociety = primary_gated_society || society || null;
    const finalShift = preferred_shift || shift_hours || 'Full Day (8–12 Hours)';

    const skillsArray = Array.isArray(skills) ? skills : (Array.isArray(category) ? category : ['maid']);
    const languagesArray = Array.isArray(languages_spoken) ? languages_spoken : (Array.isArray(languages) ? languages : ['Hindi']);

    // 2. Upsert worker_profiles (no runtime DDL — schema managed via migrations)
    await queryDb(`
      INSERT INTO public.worker_profiles 
           (user_id, id, name, full_name, gender, age, experience_years, expected_salary, skills, category, languages_spoken, primary_gated_society, preferred_shift, aadhaar_front_url, aadhaar_back_url, avatar_url, profile_picture_url, status)
      VALUES 
           ($1, $1, $2, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, $11, $12, $13, $13, 'pending_review')
      ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name,
           full_name = EXCLUDED.full_name,
           gender = EXCLUDED.gender,
           age = EXCLUDED.age,
           experience_years = EXCLUDED.experience_years,
           expected_salary = EXCLUDED.expected_salary,
           skills = EXCLUDED.skills,
           category = EXCLUDED.category,
           languages_spoken = EXCLUDED.languages_spoken,
           primary_gated_society = COALESCE(EXCLUDED.primary_gated_society, public.worker_profiles.primary_gated_society),
           preferred_shift = EXCLUDED.preferred_shift,
           aadhaar_front_url = COALESCE(EXCLUDED.aadhaar_front_url, public.worker_profiles.aadhaar_front_url),
           aadhaar_back_url = COALESCE(EXCLUDED.aadhaar_back_url, public.worker_profiles.aadhaar_back_url),
           avatar_url = COALESCE(EXCLUDED.avatar_url, public.worker_profiles.avatar_url),
           profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, public.worker_profiles.profile_picture_url),
           status = 'pending_review'
    `, [
      activeUserId,
      displayName,
      finalGender,
      finalAge,
      finalExp,
      finalSalary,
      skillsArray,
      languagesArray,
      finalSociety,
      finalShift,
      aadhaar_front_url || null,
      aadhaar_back_url || null,
      avatar_url || profile_picture_url || null
    ]);

    // 3. Update public.profiles (no runtime DDL)
    await queryDb(`
      UPDATE public.profiles
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          status = 'pending_review'
      WHERE id = $3 OR id::text = $3::text;
    `, [displayName, formattedPhone, activeUserId]);

    // 4. Log User Audit Action
    logAuditAction({
      action: 'Worker Onboarding Submitted',
      category: 'worker_activity',
      severity: 'info',
      actor: formattedPhone || displayName,
      actorRole: 'Worker',
      target_name: displayName,
      target_id: activeUserId,
      changes_summary: `Candidate '${displayName}' completed onboarding. Skills: ${skillsArray.join(', ')}. Society: ${finalSociety || 'Unspecified'}.`,
      raw_payload: body
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Worker onboarding completed successfully!',
      profile: {
        user_id: activeUserId,
        id: activeUserId,
        full_name: displayName,
        name: displayName,
        phone: formattedPhone,
        gender: finalGender,
        age: finalAge,
        experience_years: finalExp,
        expected_salary: finalSalary,
        skills: skillsArray,
        languages_spoken: languagesArray,
        primary_gated_society: finalSociety,
        preferred_shift: finalShift,
        status: 'pending_verification'
      }
    });

  } catch (error: any) {
    console.error('Error in worker onboarding API route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
