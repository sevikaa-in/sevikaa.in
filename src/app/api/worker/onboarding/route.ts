import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      userId, id, user_id, 
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

    const activeUserId = userId || id || user_id;
    if (!activeUserId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

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

    // 1. Ensure DB columns exist
    await queryDb(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
      ALTER TABLE public.worker_profiles 
      ADD COLUMN IF NOT EXISTS name text,
      ADD COLUMN IF NOT EXISTS full_name text,
      ADD COLUMN IF NOT EXISTS gender text,
      ADD COLUMN IF NOT EXISTS age integer,
      ADD COLUMN IF NOT EXISTS experience_years integer,
      ADD COLUMN IF NOT EXISTS expected_salary numeric,
      ADD COLUMN IF NOT EXISTS skills text[],
      ADD COLUMN IF NOT EXISTS category text[],
      ADD COLUMN IF NOT EXISTS languages_spoken text[],
      ADD COLUMN IF NOT EXISTS primary_gated_society text,
      ADD COLUMN IF NOT EXISTS preferred_shift text,
      ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
      ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
      ADD COLUMN IF NOT EXISTS avatar_url text,
      ADD COLUMN IF NOT EXISTS profile_picture_url text,
      ADD COLUMN IF NOT EXISTS status text;
    `);

    // 2. Upsert worker_profiles
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
           status = 'pending_review';
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

    // 3. Update public.profiles
    await queryDb(`
      UPDATE public.profiles
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          status = 'pending_review'
      WHERE id = $3 OR id::text = $3::text;
    `, [displayName, formattedPhone, activeUserId]);

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
