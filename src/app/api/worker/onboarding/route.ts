import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';
import { verifyOnboardingJwt, signSupabaseJwt, generateRefreshToken, hashRefreshToken } from '@/lib/jwtHelper';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = extractClientIp(req);

    // Distributed Rate Limit — IP Dimension (5 attempts / 15 min per IP)
    const rlIp = await checkRateLimitCritical(`worker_onboarding:ip:${clientIp}`, 5, 900000);
    if (rlIp.unavailable) {
      return NextResponse.json({
        success: false,
        error: 'Service Unavailable',
        message: 'Rate limiting service temporarily unavailable.'
      }, { status: 503 });
    }
    if (!rlIp.success) {
      return NextResponse.json({
        success: false,
        error: 'Too Many Requests',
        message: 'Too many onboarding submission attempts. Please wait 15 minutes before trying again.'
      }, { status: 429 });
    }

    // 1. Authenticate session — ONLY accept valid, short-lived Onboarding Credential
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      const obCookie = req.cookies.get('sevikaa_onboarding_token')?.value;
      if (obCookie) {
        token = obCookie;
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Authentication required for onboarding.' }, { status: 401 });
    }

    // PART 2: NO fallback to normal access JWT or supabase.auth.getUser()
    // Endpoint accepts ONLY a cryptographically verified Onboarding Credential
    const verifiedOb = verifyOnboardingJwt(token);
    if (!verifiedOb) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid, expired, or wrong-purpose onboarding credential. Normal access tokens are not permitted.'
      }, { status: 401 });
    }

    const activeUserId = verifiedOb.userId;
    let userEmail = verifiedOb.email;
    let userPhone = verifiedOb.phone;

    // Distributed Rate Limit — User Dimension (5 attempts / 15 min per verified user)
    const rlUser = await checkRateLimitCritical(`worker_onboarding:user:${activeUserId}`, 5, 900000);
    if (rlUser.unavailable) {
      return NextResponse.json({
        success: false,
        error: 'Service Unavailable',
        message: 'Rate limiting service temporarily unavailable.'
      }, { status: 503 });
    }
    if (!rlUser.success) {
      return NextResponse.json({
        success: false,
        error: 'Too Many Requests',
        message: 'Too many onboarding submission attempts. Please wait 15 minutes before trying again.'
      }, { status: 429 });
    }

    // Verify account status from public.profiles: MUST be role 'worker' and status 'onboarding_pending'
    const profRes = await queryDb(`SELECT id, role, status, email, phone, full_name FROM public.profiles WHERE id = $1 LIMIT 1`, [activeUserId]);
    if (!profRes?.rows?.[0]) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Account profile not found.' }, { status: 401 });
    }

    const dbProfile = profRes.rows[0];
    if (dbProfile.role !== 'worker') {
      return NextResponse.json({ success: false, error: 'Forbidden', message: 'Onboarding is permitted only for worker accounts.' }, { status: 403 });
    }

    if (dbProfile.status !== 'onboarding_pending') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: 'Account is not in onboarding_pending status. Onboarding credentials cannot be reused after completion.'
      }, { status: 403 });
    }

    userEmail = userEmail || dbProfile.email;
    userPhone = userPhone || dbProfile.phone;

    // PART 3: Parse and strictly validate required worker data (NO fabricated defaults)
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

    const displayName = (full_name || name || dbProfile.full_name || '').trim();
    if (!displayName) {
      return NextResponse.json({ success: false, error: 'Validation Error', message: 'Full name is required.' }, { status: 400 });
    }

    // Gender validation: must be 'male' | 'female' | 'other'
    const rawGender = (gender || '').toString().toLowerCase().trim();
    if (!rawGender || !['male', 'female', 'other'].includes(rawGender)) {
      return NextResponse.json({ success: false, error: 'Validation Error', message: 'Gender is required and must be male, female, or other.' }, { status: 400 });
    }

    // Age validation: integer between 18 and 80
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 80) {
      return NextResponse.json({ success: false, error: 'Validation Error', message: 'Age is required and must be an integer between 18 and 80.' }, { status: 400 });
    }

    // Expected salary validation: integer > 0
    const rawSalary = expected_salary !== undefined ? expected_salary : salary;
    const parsedSalary = parseInt(rawSalary, 10);
    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      return NextResponse.json({ success: false, error: 'Validation Error', message: 'Expected salary is required and must be greater than 0.' }, { status: 400 });
    }

    // Skills validation: non-empty array
    const rawSkills = Array.isArray(skills) && skills.length > 0 ? skills : (Array.isArray(category) && category.length > 0 ? category : null);
    if (!rawSkills || rawSkills.length === 0) {
      return NextResponse.json({ success: false, error: 'Validation Error', message: 'At least one skill is required.' }, { status: 400 });
    }

    // Languages validation: non-empty array
    const rawLanguages = Array.isArray(languages_spoken) && languages_spoken.length > 0 ? languages_spoken : (Array.isArray(languages) && languages.length > 0 ? languages : null);
    if (!rawLanguages || rawLanguages.length === 0) {
      return NextResponse.json({ success: false, error: 'Validation Error', message: 'At least one spoken language is required.' }, { status: 400 });
    }

    const parsedExp = parseInt(experience_years || experience, 10) || 0;
    const cleanPhoneDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const formattedPhone = cleanPhoneDigits ? `+91${cleanPhoneDigits}` : (userPhone || phone);
    const finalSociety = primary_gated_society || society || null;
    const finalShift = preferred_shift || shift_hours || null;

    // PART 4: Upsert worker_profiles with real validated onboarding input
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
           preferred_shift = COALESCE(EXCLUDED.preferred_shift, public.worker_profiles.preferred_shift),
           aadhaar_front_url = COALESCE(EXCLUDED.aadhaar_front_url, public.worker_profiles.aadhaar_front_url),
           aadhaar_back_url = COALESCE(EXCLUDED.aadhaar_back_url, public.worker_profiles.aadhaar_back_url),
           avatar_url = COALESCE(EXCLUDED.avatar_url, public.worker_profiles.avatar_url),
           profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, public.worker_profiles.profile_picture_url),
           status = 'pending_review'
    `, [
      activeUserId,
      displayName,
      rawGender,
      parsedAge,
      parsedExp,
      parsedSalary,
      rawSkills,
      rawLanguages,
      finalSociety,
      finalShift,
      aadhaar_front_url || null,
      aadhaar_back_url || null,
      avatar_url || profile_picture_url || null
    ]);

    // Update public.profiles status
    await queryDb(`
      UPDATE public.profiles
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          status = 'pending_review'
      WHERE id = $3 OR id::text = $3::text;
    `, [displayName, formattedPhone, activeUserId]);

    // Create persistent refresh session
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

    // Final Verification Gatekeeper Check
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

    // Issue normal Access JWT Token
    const accessToken = signSupabaseJwt(activeUserId, userEmail, formattedPhone || userPhone, 'worker');

    // Log User Audit Action (SAFE METADATA ONLY — NO PII / RAW BODY)
    logAuditAction({
      action: 'Worker Onboarding Completed',
      category: 'worker_activity',
      severity: 'info',
      actor: activeUserId,
      actorRole: 'Worker',
      target_name: displayName,
      target_id: activeUserId,
      changes_summary: `Candidate completed worker onboarding profile. Submitted fields: full_name, gender, age, experience_years, expected_salary, skills, languages_spoken, primary_gated_society, preferred_shift.`,
      details: {
        changed_fields: ['full_name', 'gender', 'age', 'experience_years', 'expected_salary', 'skills', 'languages_spoken', 'primary_gated_society', 'preferred_shift']
      }
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
        gender: rawGender,
        age: parsedAge,
        experience_years: parsedExp,
        expected_salary: parsedSalary,
        skills: rawSkills,
        languages_spoken: rawLanguages,
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
