import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, name, full_name, phone, email, gender, age, 
      expectedSalary, experience, skills, languages, languages_spoken, bio, 
      emergencyContact, preferredShift, profile_picture_url, onboarding_step, status,
      aadhaar_front_url, aadhaar_back_url, video_url
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const displayName = full_name || name || 'Worker';
    const expYears = parseInt(experience) || 0;
    const salary = parseInt(expectedSalary) || 15000;
    const numAge = parseInt(age) || 28;
    const currentStep = parseInt(onboarding_step) || 1;

    // 1. Update public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET phone = COALESCE($1, phone),
             email = COALESCE($2, email)
         WHERE id = $3`,
        [phone || null, email || null, userId]
      );
    } catch (pErr) {
      console.warn("Profiles update notice:", pErr);
    }

    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);
    const langsArr = Array.isArray(languages_spoken || languages) 
      ? (languages_spoken || languages) 
      : ((languages_spoken || languages) ? [languages_spoken || languages] : ['Hindi']);

    const primarySoc = body.primary_gated_society || body.primary_society_id || '';
    const prefAreas = Array.isArray(body.preferred_areas) ? body.preferred_areas : (primarySoc ? [primarySoc] : []);

    // 2. Direct PostgreSQL update with queryDb (only existing columns)
    try {
      const checkRes = await queryDb(
        `SELECT id FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, 
        [userId]
      );

      if (checkRes && checkRes.rows.length > 0) {
        await queryDb(
          `UPDATE public.worker_profiles 
           SET full_name = $1, 
               gender = COALESCE($2, gender), 
               age = COALESCE($3, age), 
               expected_salary = COALESCE($4, expected_salary), 
               experience_years = COALESCE($5, experience_years),
               skills = COALESCE($6, skills),
               languages_spoken = COALESCE($7, languages_spoken),
               profile_picture_url = CASE WHEN $8 IS NOT NULL AND $8 != '' THEN $8 ELSE profile_picture_url END,
               aadhaar_front_url = CASE WHEN $9 IS NOT NULL AND $9 != '' THEN $9 ELSE aadhaar_front_url END,
               aadhaar_back_url = CASE WHEN $10 IS NOT NULL AND $10 != '' THEN $10 ELSE aadhaar_back_url END,
               video_url = CASE WHEN $11 IS NOT NULL AND $11 != '' THEN $11 ELSE video_url END,
               preferred_areas = CASE WHEN $12::text[] IS NOT NULL AND array_length($12::text[], 1) > 0 THEN $12::text[] ELSE preferred_areas END
           WHERE user_id = $13 OR id = $13`,
          [displayName, gender || null, numAge || null, salary || null, expYears || null, 
           skillsArr.length ? skillsArr : null, langsArr.length ? langsArr : null, 
           profile_picture_url || null, aadhaar_front_url || null, aadhaar_back_url || null,
           video_url || null, prefAreas, userId]
        );
      } else {
        await queryDb(
          `INSERT INTO public.worker_profiles 
             (id, user_id, full_name, gender, age, expected_salary, experience_years, skills, languages_spoken, profile_picture_url, aadhaar_front_url, aadhaar_back_url, video_url, preferred_areas, created_at)
           VALUES 
             ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
          [userId, displayName, gender || 'female', numAge, salary, expYears, skillsArr, langsArr, 
           profile_picture_url || null, aadhaar_front_url || null, aadhaar_back_url || null,
           video_url || null, prefAreas]
        );
      }
    } catch (dbErr) {
      console.warn("Direct DB worker_profiles update warning:", dbErr);
    }

    // 3. Supabase Admin Client sync
    if (supabaseAdmin) {
      try {
        const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);

        const payload: any = {
          user_id: userId,
          full_name: displayName,
          phone: phone || undefined,
          email: email || undefined,
          gender: gender || 'female',
          age: numAge,
          expected_salary: salary,
          experience_years: expYears,
          skills: skillsArr,
          languages_spoken: langsArr,
          bio: bio || undefined,
          emergency_contact: emergencyContact || undefined,
          preferred_shift: preferredShift || undefined,
        };

        if (profile_picture_url) payload.profile_picture_url = profile_picture_url;
        if (aadhaar_front_url) payload.aadhaar_front_url = aadhaar_front_url;
        if (aadhaar_back_url) payload.aadhaar_back_url = aadhaar_back_url;
        if (video_url) payload.video_url = video_url;
        if (status) payload.status = status;
        if (currentStep) payload.onboarding_step = currentStep;

        const { data: existingWp } = await supabaseAdmin
          .from('worker_profiles')
          .select('id')
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle();

        if (existingWp) {
          await supabaseAdmin
            .from('worker_profiles')
            .update(payload)
            .eq('id', existingWp.id);
        } else {
          await supabaseAdmin
            .from('worker_profiles')
            .insert([{ ...payload, id: userId }]);
        }
      } catch (adminErr) {
        console.warn("Supabase admin worker update warning:", adminErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      name: displayName, 
      onboarding_step: currentStep, 
      completed_steps: Math.min(currentStep, 5) 
    });
  } catch (err: any) {
    console.error("Worker profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
