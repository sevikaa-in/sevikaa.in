import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';
import { verifyOnboardingJwt, signSupabaseJwt, generateRefreshToken, hashRefreshToken } from '@/lib/jwtHelper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session — check Onboarding Token or normal session token
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      const obCookie = req.cookies.get('sevikaa_onboarding_token')?.value;
      if (obCookie) {
        token = obCookie;
      } else {
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
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Authentication required for onboarding.' }, { status: 401 });
    }

    let activeUserId: string | null = null;
    let userEmail: string | undefined = undefined;
    let userPhone: string | undefined = undefined;

    // First attempt: Verify as Onboarding JWT
    const verifiedOb = verifyOnboardingJwt(token);
    if (verifiedOb) {
      activeUserId = verifiedOb.userId;
      userEmail = verifiedOb.email;
      userPhone = verifiedOb.phone;
    } else {
      // Second attempt: Verify as normal Supabase session token
      if (!supabaseUrl.includes('placeholder')) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
        if (user?.id) {
          activeUserId = user.id;
          userEmail = user.email;
          userPhone = user.phone;
        }
      }
    }

    if (!activeUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid or expired onboarding credential.' }, { status: 401 });
    }

    // Verify account status from public.profiles
    const profRes = await queryDb(`SELECT id, role, status, email, phone, full_name FROM public.profiles WHERE id = $1 LIMIT 1`, [activeUserId]);
    if (!profRes?.rows?.[0]) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Account profile not found.' }, { status: 401 });
    }

    const dbProfile = profRes.rows[0];
    if (dbProfile.status === 'suspended' || dbProfile.status === 'banned') {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Account is suspended or banned.' }, { status: 403 });
    }

    userEmail = userEmail || dbProfile.email;
    userPhone = userPhone || dbProfile.phone;

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

    const displayName = full_name || name || dbProfile.full_name || 'Worker Candidate';
    const cleanPhoneDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const formattedPhone = cleanPhoneDigits ? `+91${cleanPhoneDigits}` : (userPhone || phone);
    const finalGender = gender || 'female';
    const finalAge = parseInt(age) || 28;
    const finalExp = parseInt(experience_years || experience) || 0;
    const finalSalary = parseInt(expected_salary || salary) || 15000;
    const finalSociety = primary_gated_society || society || null;
    const finalShift = preferred_shift || shift_hours || 'Full Day (8–12 Hours)';

    const skillsArray = Array.isArray(skills) ? skills : (Array.isArray(category) ? category : ['maid']);
    const languagesArray = Array.isArray(languages_spoken) ? languages_spoken : (Array.isArray(languages) ? languages : ['Hindi']);

    // 2. Upsert worker_profiles with real collected onboarding input
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

    // 3. Update public.profiles status
    await queryDb(`
      UPDATE public.profiles
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          status = 'pending_review'
      WHERE id = $3 OR id::text = $3::text;
    `, [displayName, formattedPhone, activeUserId]);

    // 4. Create persistent refresh session
    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let refreshPersisted = false;
    try {
      const refreshInsertRes = await queryDb(
        `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [activeUserId, tokenHash, expiresAt]
      );
      if (refreshInsertRes?.rows?.[0]?.id) {
        refreshPersisted = true;
      }
    } catch (refreshErr) {
      console.error('[worker-onboarding] Refresh token persistence error:', refreshErr);
    }

    if (!refreshPersisted) {
      return NextResponse.json({ success: false, error: 'Authentication Failed', message: 'Failed to establish persistent session after onboarding.' }, { status: 500 });
    }

    // 5. Final Verification Gatekeeper Check
    let gatePassed = false;
    try {
      const gateRes = await queryDb(
        `SELECT 
           (SELECT COUNT(*) FROM public.profiles WHERE id = $1) AS profile_count,
           (SELECT COUNT(*) FROM public.worker_profiles WHERE user_id = $1 OR id = $1) AS role_profile_count,
           (SELECT COUNT(*) FROM public.refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND is_revoked = FALSE AND expires_at > NOW()) AS session_count`,
        [activeUserId, tokenHash]
      );
      const counts = gateRes?.rows?.[0];
      if (
        counts &&
        parseInt(counts.profile_count, 10) > 0 &&
        parseInt(counts.role_profile_count, 10) > 0 &&
        parseInt(counts.session_count, 10) > 0
      ) {
        gatePassed = true;
      }
    } catch (gErr) {
      console.error('[worker-onboarding] Gatekeeper error:', gErr);
    }

    if (!gatePassed) {
      await queryDb(`DELETE FROM public.refresh_tokens WHERE token_hash = $1`, [tokenHash]).catch(() => {});
      return NextResponse.json({ success: false, error: 'Onboarding Verification Failed', message: 'Incomplete account provisioning after onboarding.' }, { status: 500 });
    }

    // 6. Issue normal Access JWT Token
    const accessToken = signSupabaseJwt(activeUserId, userEmail, formattedPhone || userPhone, 'worker');

    // 7. Log User Audit Action
    logAuditAction({
      action: 'Worker Onboarding Completed',
      category: 'worker_activity',
      severity: 'info',
      actor: formattedPhone || displayName,
      actorRole: 'Worker',
      target_name: displayName,
      target_id: activeUserId,
      changes_summary: `Candidate '${displayName}' completed onboarding. Skills: ${skillsArray.join(', ')}. Society: ${finalSociety || 'Unspecified'}.`,
      raw_payload: body
    }).catch(() => {});

    const userObj = {
      id: activeUserId,
      email: userEmail,
      phone: formattedPhone || userPhone,
      role: 'worker',
      full_name: displayName,
      society: finalSociety || ''
    };

    const isWebClient = req.headers.get('x-client-platform') === 'web' || Boolean(req.headers.get('origin')) || Boolean(req.headers.get('referer'));

    const res = NextResponse.json({
      success: true,
      message: 'Worker onboarding completed successfully!',
      hasCompletedProfile: true,
      user: userObj,
      session: {
        access_token: accessToken,
        ...(isWebClient ? {} : { refresh_token: refreshToken }),
        token_type: 'bearer',
        user: userObj
      },
      token: accessToken,
      access_token: accessToken,
      ...(isWebClient ? {} : { refresh_token: refreshToken }),
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
        status: 'pending_review'
      }
    });

    // Clear temporary onboarding cookie if set
    res.cookies.set('sevikaa_onboarding_token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });

    if (refreshToken) {
      res.cookies.set('sevikaa_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      });
    }

    res.cookies.set('sevikaa_user_role', 'worker', { path: '/', maxAge: 2592000, sameSite: 'lax' });
    res.cookies.set('sevikaa_user_id', activeUserId, { path: '/', maxAge: 2592000, sameSite: 'lax' });

    return res;

  } catch (error: any) {
    console.error('Error in worker onboarding API route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
