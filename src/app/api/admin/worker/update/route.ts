import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { memoryCache } from '@/lib/memoryCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, full_name, phone, email, gender, age, 
      expected_salary, experience_years, skills, languages_spoken,
      emergency_contact, profile_picture_url, aadhaar_front_url, 
      aadhaar_back_url, video_url, status, asset_statuses,
      primary_society_id, secondary_society_ids
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const displayName = full_name || 'Worker';
    const numAge = parseInt(age) || 28;
    const salary = parseInt(expected_salary) || 0;
    const expYears = parseInt(experience_years) || 0;
    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);
    const langsArr = Array.isArray(languages_spoken) ? languages_spoken : (languages_spoken ? [languages_spoken] : []);

    const verificationNotes = asset_statuses ? JSON.stringify(asset_statuses) : null;

    // 1. Update public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET phone = COALESCE($1, phone),
             email = COALESCE($2, email),
             status = COALESCE($3, status)
         WHERE id = $4`,
        [phone || null, email || null, status || null, userId]
      );
    } catch (pErr) {
      console.warn("Profiles update warning:", pErr);
    }

    // 2. Direct PostgreSQL update for public.worker_profiles
    try {
      const checkRes = await queryDb(
        `SELECT id FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, 
        [userId]
      );

      const primarySoc = body.primary_gated_society || body.primary_society_id || '';
      const secondarySoc = body.secondary_gated_society || '';
      const prefAreas = [primarySoc, secondarySoc].filter(Boolean);

      if (checkRes && checkRes.rows.length > 0) {
        await queryDb(
          `UPDATE public.worker_profiles 
           SET full_name = COALESCE($1, full_name), 
               gender = COALESCE($2, gender), 
               age = COALESCE($3, age), 
               expected_salary = COALESCE($4, expected_salary), 
               experience_years = COALESCE($5, experience_years),
               emergency_contact = COALESCE($6, emergency_contact),
               profile_picture_url = COALESCE($7, profile_picture_url),
               aadhaar_front_url = COALESCE($8, aadhaar_front_url),
               aadhaar_back_url = COALESCE($9, aadhaar_back_url),
               video_url = COALESCE($10, video_url),
               skills = COALESCE($11, skills),
               languages_spoken = COALESCE($12, languages_spoken),
               preferred_areas = CASE WHEN $13::text[] IS NOT NULL AND array_length($13::text[], 1) > 0 THEN $13::text[] ELSE preferred_areas END
           WHERE user_id = $14 OR id = $14`,
          [
            displayName, gender || null, numAge, salary, expYears, 
            emergency_contact || null, profile_picture_url || null, 
            aadhaar_front_url || null, aadhaar_back_url || null, 
            video_url || null, skillsArr, langsArr, prefAreas, userId
          ]
        );
      } else {
        await queryDb(
          `INSERT INTO public.worker_profiles 
             (id, user_id, full_name, phone, email, gender, age, expected_salary, experience_years, emergency_contact, profile_picture_url, aadhaar_front_url, aadhaar_back_url, video_url, skills, status)
           VALUES 
             ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            userId, displayName, phone || null, email || null, gender || 'female', 
            numAge, salary, expYears, emergency_contact || null, 
            profile_picture_url || null, aadhaar_front_url || null, 
            aadhaar_back_url || null, video_url || null, skillsArr, status || 'pending_review'
          ]
        );
      }

      // Update primary & secondary societies if provided
      if (primary_society_id) {
        await queryDb(
          `UPDATE public.worker_profiles SET primary_society_id = $1 WHERE user_id = $2 OR id = $2`,
          [primary_society_id, userId]
        );
      }

      if (Array.isArray(secondary_society_ids)) {
        await queryDb(`DELETE FROM public.worker_societies WHERE worker_id = $1`, [userId]);
        for (const socId of secondary_society_ids) {
          if (socId) {
            await queryDb(
              `INSERT INTO public.worker_societies (worker_id, society_id, is_primary) VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
              [userId, socId]
            );
          }
        }
      }
    } catch (dbErr) {
      console.warn("Direct DB worker_profiles update warning:", dbErr);
    }

    // 3. Supabase Admin Client Sync
    if (supabaseAdmin) {
      try {
        const payload: any = {
          user_id: userId,
          full_name: displayName,
          phone: phone || undefined,
          email: email || undefined,
          gender: gender || undefined,
          age: numAge,
          expected_salary: salary,
          experience_years: expYears,
          emergency_contact: emergency_contact || undefined,
          profile_picture_url: profile_picture_url || undefined,
          aadhaar_front_url: aadhaar_front_url || undefined,
          aadhaar_back_url: aadhaar_back_url || undefined,
          video_url: video_url || undefined,
          skills: skillsArr
        };
        if (status) payload.status = status;

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

    // Invalidate server memory cache
    memoryCache.invalidatePattern('admin');
    memoryCache.invalidatePattern('superadmin');

    return NextResponse.json({ success: true, name: displayName });
  } catch (err: any) {
    console.error("Admin worker update API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
