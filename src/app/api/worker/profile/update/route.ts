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
    const expYears = Math.max(0, parseInt(experience) || 0);
    const parsedSalary = parseInt(expectedSalary);
    const salary = (parsedSalary && parsedSalary > 0) ? parsedSalary : 15000;
    const numAge = Math.max(18, Math.min(80, parseInt(age) || 28));
    let cleanGender = (gender || '').toLowerCase().trim();
    if (!['male', 'female', 'other'].includes(cleanGender)) {
      cleanGender = 'female';
    }
    const currentStep = parseInt(onboarding_step) || 1;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedUserId = userId;

    // 1. Ensure public.profiles entry exists to satisfy foreign key constraint
    try {
      const existingP = await queryDb(
        `SELECT id FROM public.profiles WHERE id::text = $1 OR phone = $1 OR email = $1 LIMIT 1`,
        [userId]
      );

      if (existingP?.rows?.[0]?.id) {
        resolvedUserId = existingP.rows[0].id;
        await queryDb(
          `UPDATE public.profiles 
           SET phone = COALESCE($1, phone),
               email = COALESCE($2, email),
               status = COALESCE($3, status)
           WHERE id::text = $4`,
          [phone || null, email || null, status || null, resolvedUserId]
        );
      } else {
        if (!uuidRegex.test(resolvedUserId)) {
          resolvedUserId = crypto.randomUUID();
        }
        await queryDb(
          `INSERT INTO public.profiles (id, phone, email, role, status, created_at)
           VALUES ($1::uuid, $2, $3, 'worker', COALESCE($4, 'live'), NOW())
           ON CONFLICT (id) DO UPDATE SET 
             phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
             email = COALESCE(EXCLUDED.email, public.profiles.email)`,
          [resolvedUserId, phone || null, email || null, status || null]
        );
      }
    } catch (pErr) {
      console.warn("Profiles sync notice:", pErr);
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

    // 2. Direct PostgreSQL update with queryDb (only existing columns)
    try {
      await queryDb(`
        ALTER TABLE public.worker_profiles 
        ADD COLUMN IF NOT EXISTS bio text,
        ADD COLUMN IF NOT EXISTS preferred_shift text,
        ADD COLUMN IF NOT EXISTS emergency_contact text,
        ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
        ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
        ADD COLUMN IF NOT EXISTS preferred_society_name text,
        ADD COLUMN IF NOT EXISTS secondary_society_name text;
      `).catch(() => {});

      const checkRes = await queryDb(
        `SELECT id FROM public.worker_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`, 
        [resolvedUserId]
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
      const workerEmergency = body.emergencyContact || body.emergency_contact || null;
      const pSoc = primarySoc || null;
      const sSoc = secondarySoc || null;

      let pSocId = body.primary_society_id || body.society_id || null;

      if (!pSocId && primarySoc) {
        try {
          const socRes = await queryDb(
            `SELECT id, name FROM public.societies WHERE name ILIKE $1 OR name ILIKE $2 LIMIT 1`,
            [primarySoc.trim(), `%${primarySoc.trim()}%`]
          );
          if (socRes?.rows?.[0]?.id) {
            pSocId = socRes.rows[0].id;
          }
        } catch (sErr) {
          console.warn("Society lookup notice:", sErr);
        }
      }

      if (checkRes && checkRes.rows.length > 0) {
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
               preferred_areas = CASE WHEN $12::text[] IS NOT NULL AND array_length($12::text[], 1) > 0 THEN $12::text[] ELSE preferred_areas END,
               bio = CASE WHEN $14::text IS NOT NULL AND $14::text != '' THEN $14::text ELSE bio END,
               preferred_shift = CASE WHEN $15::text IS NOT NULL AND $15::text != '' THEN $15::text ELSE preferred_shift END,
               emergency_contact = CASE WHEN $16::text IS NOT NULL AND $16::text != '' THEN $16::text ELSE emergency_contact END,
               preferred_society_name = CASE WHEN $17::text IS NOT NULL AND $17::text != '' THEN $17::text ELSE preferred_society_name END,
               secondary_society_name = CASE WHEN $18::text IS NOT NULL AND $18::text != '' THEN $18::text ELSE secondary_society_name END,
               preferred_society_id = CASE WHEN $19::text IS NOT NULL AND $19::text != '' AND $19::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $19::uuid ELSE preferred_society_id END,
               is_aadhaar_verified = CASE 
                 WHEN ($9::text IS NOT NULL AND $9::text != '') OR ($10::text IS NOT NULL AND $10::text != '') THEN true 
                 ELSE is_aadhaar_verified 
               END
           WHERE user_id::text = $13 OR id::text = $13`,
          [displayName, cleanGender, numAge, salary, expYears, 
           skillsArr.length ? skillsArr : null, langsArr.length ? langsArr : null, 
           profile_picture_url || null, aadhaar_front_url || null, aadhaar_back_url || null,
           video_url || null, prefAreas, resolvedUserId, workerBio, workerShift, workerEmergency, pSoc, sSoc, pSocId]
        );
      } else {
        await queryDb(
          `INSERT INTO public.worker_profiles 
             (id, user_id, full_name, gender, age, expected_salary, experience_years, skills, languages_spoken, profile_picture_url, aadhaar_front_url, aadhaar_back_url, video_url, preferred_areas, bio, preferred_shift, emergency_contact, preferred_society_name, secondary_society_name, preferred_society_id, created_at)
           VALUES 
             (gen_random_uuid(), CASE WHEN $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $1::uuid ELSE gen_random_uuid() END, $2::text, $3::text, $4::integer, $5::integer, $6::integer, $7::text[], $8::text[], $9::text, $10::text, $11::text, $12::text, $13::text[], $14::text, $15::text, $16::text, $17::text, $18::text, CASE WHEN $19::text IS NOT NULL AND $19::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $19::uuid ELSE NULL END, NOW())`,
          [resolvedUserId, displayName, cleanGender, numAge, salary, expYears, skillsArr, langsArr, 
           profile_picture_url || null, aadhaar_front_url || null, aadhaar_back_url || null,
           video_url || null, prefAreas, workerBio, workerShift, workerEmergency, pSoc, sSoc, pSocId]
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
