import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { memoryCache } from '@/lib/memoryCache';
import { logAuditAction } from '@/lib/auditLogger';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function POST(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

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

    // Strict 100% Completeness Validation Before Approval
    if (status === 'live' || status === 'approved' || status === 'active') {
      try {
        const wRes = await queryDb(
          `SELECT wp.*, p.phone FROM public.worker_profiles wp LEFT JOIN public.profiles p ON wp.user_id = p.id WHERE wp.user_id::text = $1 OR wp.id::text = $1 LIMIT 1`,
          [userId]
        );
        if (wRes?.rows?.[0]) {
          const row = wRes.rows[0];
          const hasName = !!(full_name || row.full_name || row.name)?.trim();
          const hasPhone = (phone || row.phone || '').replace(/\D/g, '').length >= 10;
          const hasGenderAge = !!(gender || row.gender) && !!(age || row.age);
          const hasSkills = Array.isArray(skills || row.skills) ? (skills || row.skills).length > 0 : !!(skills || row.skills);
          const hasSalary = !!(expected_salary || row.expected_salary);
          const hasExperience = (experience_years !== undefined || row.experience_years !== undefined);
          const hasLanguages = Array.isArray(languages_spoken || row.languages_spoken) && (languages_spoken || row.languages_spoken).length > 0;
          const hasPhoto = !!(profile_picture_url || row.profile_picture_url || row.avatar_url);
          const hasAadhaarFront = !!(aadhaar_front_url || row.aadhaar_front_url);
          const hasAadhaarBack = !!(aadhaar_back_url || row.aadhaar_back_url);

          const isTelePassed = body.is_tele_onboarded === true || body.tele_onboarded === true || body.is_interview_verified === true || row.is_tele_onboarded === true || row.is_interview_verified === true;
          if (!isTelePassed) {
            return NextResponse.json({
              success: false,
              error: `Cannot mark worker Live: Telephonic Onboarding Verification required. Candidate must pass Tele-Onboarding before Live approval.`
            }, { status: 400 });
          }

          const steps = [hasName, hasPhone, hasGenderAge, hasSkills, hasSalary, hasExperience, hasLanguages, hasPhoto, hasAadhaarFront, hasAadhaarBack];
          const count = steps.filter(Boolean).length;
          if (count < 10) {
            return NextResponse.json({
              success: false,
              error: `Cannot approve worker profile: Only ${count * 10}% complete (${count} of 10 steps). All 10 profile steps must be 100% complete before Admin approval.`
            }, { status: 400 });
          }
        }
      } catch (checkErr) {
        console.warn("Backend worker completeness check warning:", checkErr);
      }
    }

    const displayName = (full_name && typeof full_name === 'string' && full_name.trim()) ? full_name.trim() : null;
    const numAge = (age !== undefined && age !== null && age !== '') ? Math.max(18, Math.min(80, parseInt(age))) : null;
    const salary = (expected_salary !== undefined && expected_salary !== null && expected_salary !== '') ? parseInt(expected_salary) : null;
    const expYears = (experience_years !== undefined && experience_years !== null && experience_years !== '') ? parseInt(experience_years) : null;

    let cleanGender = (gender && typeof gender === 'string' && gender.trim()) ? gender.toLowerCase().trim() : null;
    if (cleanGender && !['male', 'female', 'other'].includes(cleanGender)) {
      cleanGender = null;
    }
    const skillsArr = (skills !== undefined && skills !== null)
      ? (Array.isArray(skills) ? skills : (typeof skills === 'string' && skills.trim() ? [skills] : null))
      : null;
    const langsArr = (languages_spoken !== undefined && languages_spoken !== null)
      ? (Array.isArray(languages_spoken) ? languages_spoken : (typeof languages_spoken === 'string' && languages_spoken.trim() ? [languages_spoken] : null))
      : null;

    const verificationNotes = asset_statuses ? JSON.stringify(asset_statuses) : null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedUserId = userId;

    // 1. Ensure profiles entry exists (schema managed via migrations — no runtime DDL)
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
               status = CASE 
                 WHEN $3::text IS NOT NULL AND $3::text != 'pending_verification' THEN $3::text 
                 WHEN public.profiles.status = 'pending_verification' OR $3::text = 'pending_verification' THEN 'pending_review'
                 ELSE public.profiles.status 
               END
           WHERE id::text = $4 OR id::text = (SELECT user_id::text FROM public.worker_profiles WHERE id::text = $4 LIMIT 1)`,
          [phone || null, email || null, status || null, resolvedUserId]
        );
      } else {
        if (!uuidRegex.test(resolvedUserId)) {
          resolvedUserId = crypto.randomUUID();
        }
        await queryDb(
          `INSERT INTO public.profiles (id, phone, email, role, status, created_at)
           VALUES ($1::uuid, $2, $3, 'worker', CASE WHEN $4::text = 'pending_verification' OR $4 IS NULL THEN 'pending_review' ELSE $4::text END, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
             email = COALESCE(EXCLUDED.email, public.profiles.email),
             status = CASE WHEN EXCLUDED.status = 'pending_verification' THEN 'pending_review' ELSE COALESCE(EXCLUDED.status, public.profiles.status) END`,
          [resolvedUserId, phone || null, email || null, status || null]
        );
      }
    } catch (pErr) {
      console.warn("Profiles update warning:", pErr);
    }

    // 2. Direct PostgreSQL update for public.worker_profiles
    try {
      const isTelePassed = body.is_tele_onboarded === true || body.tele_onboarded === true || body.is_interview_verified === true;
      const isAadhaarFrontVer = body.is_aadhaar_front_verified === true || (isTelePassed && Boolean(aadhaar_front_url || body.aadhaar_front_url));
      const isAadhaarBackVer = body.is_aadhaar_back_verified === true || (isTelePassed && Boolean(aadhaar_back_url || body.aadhaar_back_url));
      const isAadhaarOverallVer = body.is_aadhaar_verified === true || (isAadhaarFrontVer && isAadhaarBackVer);
      const workerBio = body.bio || body.notes || null;

      const checkRes = await queryDb(
        `SELECT id FROM public.worker_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`, 
        [resolvedUserId]
      );

      const primarySoc = body.primary_gated_society || body.primary_society_name || body.society || '';
      const secondarySoc = body.secondary_gated_society || body.secondary_society_name || '';
      const prefAreas = Array.isArray(body.preferred_areas) && body.preferred_areas.length > 0 
        ? body.preferred_areas 
        : (primarySoc || secondarySoc ? [primarySoc, secondarySoc].filter(Boolean) : null);
      const preferred_shift = body.preferred_shift || body.work_timing || body.preferredShift || null;

      let pSocId = body.primary_society_id || body.society_id || null;
      if (!pSocId && primarySoc) {
        try {
          const socRes = await queryDb(
            `SELECT id FROM public.societies WHERE name ILIKE $1 OR name ILIKE $2 LIMIT 1`,
            [primarySoc.trim(), `%${primarySoc.trim()}%`]
          );
          if (socRes?.rows?.[0]?.id) pSocId = socRes.rows[0].id;
        } catch (sErr) { console.warn("Admin society lookup notice:", sErr); }
      }

      if (checkRes && checkRes.rows.length > 0) {
        const updateFields: string[] = [];
        const queryValues: any[] = [];
        let pIdx = 1;

        if (body.full_name !== undefined && body.full_name !== null && String(body.full_name).trim()) {
          const fn = String(body.full_name).trim();
          updateFields.push(`full_name = $${pIdx++}`);
          queryValues.push(fn);
          updateFields.push(`name = $${pIdx++}`);
          queryValues.push(fn);
        }

        if (body.gender !== undefined && body.gender !== null && String(body.gender).trim()) {
          const gen = String(body.gender).toLowerCase().trim();
          if (['male', 'female', 'other'].includes(gen)) {
            updateFields.push(`gender = $${pIdx++}`);
            queryValues.push(gen);
          }
        }

        if (body.age !== undefined && body.age !== null && body.age !== '') {
          updateFields.push(`age = $${pIdx++}`);
          queryValues.push(parseInt(body.age));
        }

        if (body.expected_salary !== undefined && body.expected_salary !== null && body.expected_salary !== '') {
          updateFields.push(`expected_salary = $${pIdx++}`);
          queryValues.push(parseInt(body.expected_salary));
        }

        if (body.experience_years !== undefined && body.experience_years !== null && body.experience_years !== '') {
          updateFields.push(`experience_years = $${pIdx++}`);
          queryValues.push(parseInt(body.experience_years));
        }

        if (body.emergency_contact !== undefined && body.emergency_contact !== null) {
          updateFields.push(`emergency_contact = $${pIdx++}`);
          queryValues.push(body.emergency_contact);
          updateFields.push(`alternate_phone = $${pIdx++}`);
          queryValues.push(body.emergency_contact);
        }

        if (body.profile_picture_url !== undefined && body.profile_picture_url !== null) {
          updateFields.push(`profile_picture_url = $${pIdx++}`);
          queryValues.push(body.profile_picture_url);
          updateFields.push(`avatar_url = $${pIdx++}`);
          queryValues.push(body.profile_picture_url);
        }

        if (body.aadhaar_front_url !== undefined && body.aadhaar_front_url !== null) {
          updateFields.push(`aadhaar_front_url = $${pIdx++}`);
          queryValues.push(body.aadhaar_front_url);
        }

        if (body.aadhaar_back_url !== undefined && body.aadhaar_back_url !== null) {
          updateFields.push(`aadhaar_back_url = $${pIdx++}`);
          queryValues.push(body.aadhaar_back_url);
        }

        if (body.video_url !== undefined && body.video_url !== null) {
          updateFields.push(`video_url = $${pIdx++}`);
          queryValues.push(body.video_url);
        }

        if (body.skills !== undefined && body.skills !== null) {
          const sArr = Array.isArray(body.skills) ? body.skills : [body.skills];
          updateFields.push(`skills = $${pIdx++}`);
          queryValues.push(sArr);
          updateFields.push(`category = $${pIdx++}`);
          queryValues.push(sArr);
        }

        if (body.languages_spoken !== undefined && body.languages_spoken !== null) {
          const lArr = Array.isArray(body.languages_spoken) ? body.languages_spoken : [body.languages_spoken];
          updateFields.push(`languages_spoken = $${pIdx++}`);
          queryValues.push(lArr);
        }

        if (primarySoc) {
          updateFields.push(`preferred_society_name = $${pIdx++}`);
          queryValues.push(primarySoc);
          updateFields.push(`primary_gated_society = $${pIdx++}`);
          queryValues.push(primarySoc);
        }

        if (secondarySoc) {
          updateFields.push(`secondary_society_name = $${pIdx++}`);
          queryValues.push(secondarySoc);
        }

        if (preferred_shift) {
          updateFields.push(`preferred_shift = $${pIdx++}`);
          queryValues.push(preferred_shift);
        }

        if (workerBio) {
          updateFields.push(`bio = $${pIdx++}`);
          queryValues.push(workerBio);
        }

        if (isTelePassed) {
          updateFields.push(`is_tele_onboarded = true`);
          updateFields.push(`is_interview_verified = true`);
          updateFields.push(`tele_onboarded_at = NOW()`);
        }

        if (body.is_aadhaar_front_verified !== undefined && body.is_aadhaar_front_verified !== null) {
          updateFields.push(`is_aadhaar_front_verified = $${pIdx++}`);
          queryValues.push(Boolean(body.is_aadhaar_front_verified));
        }

        if (body.is_aadhaar_back_verified !== undefined && body.is_aadhaar_back_verified !== null) {
          updateFields.push(`is_aadhaar_back_verified = $${pIdx++}`);
          queryValues.push(Boolean(body.is_aadhaar_back_verified));
        }

        if (body.is_aadhaar_verified !== undefined && body.is_aadhaar_verified !== null) {
          updateFields.push(`is_aadhaar_verified = $${pIdx++}`);
          queryValues.push(Boolean(body.is_aadhaar_verified));
        }

        if (body.is_video_verified !== undefined && body.is_video_verified !== null) {
          updateFields.push(`is_video_verified = $${pIdx++}`);
          queryValues.push(Boolean(body.is_video_verified));
        }

        if (body.is_police_verified !== undefined && body.is_police_verified !== null) {
          updateFields.push(`is_police_verified = $${pIdx++}`);
          queryValues.push(Boolean(body.is_police_verified));
        }

        if (body.status !== undefined && body.status !== null) {
          const cleanSt = body.status === 'pending_verification' ? 'pending_review' : body.status;
          updateFields.push(`status = $${pIdx++}`);
          queryValues.push(cleanSt);
        }

        if (updateFields.length > 0) {
          queryValues.push(resolvedUserId);
          const sql = `UPDATE public.worker_profiles SET ${updateFields.join(', ')} WHERE user_id::text = $${pIdx} OR id::text = $${pIdx}`;
          await queryDb(sql, queryValues);
        }
      } else {
        await queryDb(
          `INSERT INTO public.worker_profiles 
             (id, user_id, full_name, gender, age, expected_salary, experience_years, emergency_contact, profile_picture_url, aadhaar_front_url, aadhaar_back_url, video_url, skills, preferred_shift, preferred_society_name, secondary_society_name, preferred_society_id, created_at)
           VALUES 
             (gen_random_uuid(), CASE WHEN $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $1::uuid ELSE gen_random_uuid() END, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CASE WHEN $16::text IS NOT NULL AND $16::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $16::uuid ELSE NULL END, NOW())`,
          [
            resolvedUserId, 
            displayName || 'Worker', 
            cleanGender || 'female', 
            numAge || 28, 
            salary || 15000, 
            expYears || 0, 
            emergency_contact || null, 
            profile_picture_url || null, 
            aadhaar_front_url || null, 
            aadhaar_back_url || null, 
            video_url || null, 
            skillsArr || ['Domestic Worker'], 
            preferred_shift,
            primarySoc || null, 
            secondarySoc || null, 
            pSocId
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

    // 3. Log Audit Action with exact changes summary
    try {
      const changeParts: string[] = [];
      if (status) changeParts.push(`Status set to '${status.toUpperCase()}'`);
      if (body.is_tele_onboarded || body.tele_onboarded) changeParts.push("Telephonic Onboarding marked PASSED");
      if (body.is_aadhaar_front_verified) changeParts.push("Aadhaar Front Verified");
      if (body.is_aadhaar_back_verified) changeParts.push("Aadhaar Back Verified");
      if (body.is_video_verified) changeParts.push("Selfie / Video Profile Verified");
      if (body.is_police_verified) changeParts.push("Police PCC Clearance Verified");
      if (displayName) changeParts.push(`Name: '${displayName}'`);
      if (numAge) changeParts.push(`Age: ${numAge}`);
      if (cleanGender) changeParts.push(`Gender: ${cleanGender}`);
      if (salary) changeParts.push(`Expected Salary: ₹${salary}`);
      if (skillsArr) changeParts.push(`Skills: ${skillsArr.join(', ')}`);

      const summaryText = changeParts.length > 0 
        ? changeParts.join(" • ") 
        : "Worker profile details updated by admin moderator.";

      logAuditAction({
        req,
        action: status ? `Worker Profile ${status.toUpperCase()}` : 'Worker Profile Updated',
        category: 'moderation',
        severity: status === 'live' || status === 'approved' ? 'info' : 'warning',
        actor: body.admin_email || body.admin_name || 'admin@sevikaa.in',
        admin_email: body.admin_email || 'admin@sevikaa.in',
        admin_name: body.admin_name || 'Admin Moderator',
        actorRole: 'Moderator',
        target_name: displayName || 'Worker Candidate',
        target_id: resolvedUserId,
        changes_summary: summaryText,
        details: summaryText,
        raw_payload: body
      }).catch(() => {});
    } catch (auditErr) {
      console.warn("Worker update audit log notice:", auditErr);
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
