import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { sendEmail as dispatchEmail, sendSMS } from '@/lib/notifications';
import { getMagicLinkOrLoginOtpEmailHtml } from '@/lib/emailTemplates';
import crypto from 'crypto';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';
import { signSupabaseJwt, signOnboardingJwt } from '@/lib/jwtHelper';

// Allowed roles that can self-select during OTP registration
const SELF_SELECTABLE_ROLES = new Set(['worker', 'employer']);

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  // IP rate limiting — max 20 OTP actions per minute per IP (CRITICAL: fail-closed, no in-memory fallback)
  const rl = await checkRateLimitCritical(extractClientIp(req), 20, 60000);
  if (rl.unavailable) {
    return NextResponse.json({ error: 'Rate limiting service temporarily unavailable.' }, { status: 503 });
  }
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, phone, email, otp, role: rawRole } = body;

    // Role guard: prevent admin/super-admin self-selection through OTP
    const role = SELF_SELECTABLE_ROLES.has(rawRole) ? rawRole : 'worker';

    // -------------------------------------------------------------------------
    // ACTION: SEND OTP
    // -------------------------------------------------------------------------
    if (action === 'send') {
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone && !email) {
        return NextResponse.json({ error: 'Mobile number or email required' }, { status: 400 });
      }

      // Pre-check user existence in DB during OTP Send
      let isExistingUser = false;
      let existingRole: string | null = null;
      let hasCompletedProfile = false;

      try {
        const searchEmail = (email || '').toLowerCase().trim();
        const dbRes = await queryDb(
          `SELECT p.id, p.role, 
                  (wp.id IS NOT NULL OR ep.id IS NOT NULL) AS has_sub_profile
           FROM public.profiles p
           LEFT JOIN public.worker_profiles wp ON wp.user_id = p.id OR wp.id = p.id
           LEFT JOIN public.employer_profiles ep ON ep.user_id = p.id OR ep.id = p.id
           WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(p.phone, ''), '[^0-9]', '', 'g'), 10) = $1)
              OR ($2 <> '' AND LOWER(COALESCE(p.email, '')) = $2)
           LIMIT 1`,
          [cleanPhone, searchEmail]
        );

        if (dbRes && dbRes.rows.length > 0) {
          isExistingUser = true;
          existingRole = dbRes.rows[0].role;
          hasCompletedProfile = !!dbRes.rows[0].has_sub_profile;
        }
      } catch (checkErr) {
        console.warn("Pre-OTP user check notice:", checkErr);
      }

      // Generate cryptographically secure 6-digit OTP
      const generatedOtp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = hashOtp(generatedOtp);

      const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes
      const targetKey = cleanPhone ? `phone:${cleanPhone}` : `email:${(email || '').toLowerCase().trim()}`;

      // Persist hashed OTP in DB — table created via migration 20260810000002
      try {
        // Check send rate limit: max 5 sends per 15 minutes per target (window starts from 1st OTP)
        const rateRes = await queryDb(
          `SELECT send_count, last_sent_at FROM public.otp_verifications WHERE target_key = $1`,
          [targetKey]
        );
        const existing = rateRes?.rows?.[0];
        if (existing) {
          const windowStartAt = existing.last_sent_at ? new Date(existing.last_sent_at).getTime() : 0;
          const elapsedMs = Date.now() - windowStartAt;
          const withinWindow = elapsedMs < 15 * 60 * 1000; // 15 minutes
          if (withinWindow && (existing.send_count || 0) >= 5) {
            const minutesLeft = Math.max(1, Math.ceil((15 * 60 * 1000 - elapsedMs) / 60000));
            return NextResponse.json({
              error: `Too many OTP requests. Maximum 5 OTPs allowed per 15 minutes. Please try again in ${minutesLeft} minute(s).`
            }, { status: 429 });
          }
        }

        await queryDb(
          `INSERT INTO public.otp_verifications (target_key, otp_hash, expires_at, attempt_count, send_count, last_sent_at)
           VALUES ($1, $2, $3, 0, 1, NOW())
           ON CONFLICT (target_key) DO UPDATE
           SET otp_hash = EXCLUDED.otp_hash,
               expires_at = EXCLUDED.expires_at,
               attempt_count = 0,
               consumed_at = NULL,
               send_count = CASE
                 WHEN EXTRACT(EPOCH FROM (NOW() - public.otp_verifications.last_sent_at)) > 900
                 THEN 1
                 ELSE public.otp_verifications.send_count + 1
               END,
               last_sent_at = CASE
                 WHEN EXTRACT(EPOCH FROM (NOW() - public.otp_verifications.last_sent_at)) > 900
                 THEN NOW()
                 ELSE public.otp_verifications.last_sent_at
               END`,
          [targetKey, otpHash, expiresAtMs]
        );

      } catch (dbSaveErr) {
        console.error("DB OTP save error:", dbSaveErr);
        return NextResponse.json({ error: 'Failed to send OTP code. Please try again.' }, { status: 500 });
      }

      if (cleanPhone) {
        try {
          await sendSMS(cleanPhone, 'LOGIN_OTP', { otp: generatedOtp });
        } catch (smsErr) {
          console.warn("SMS send notice:", smsErr);
        }

        // Uniform response — never leak isExistingUser/existingRole (account enumeration)
        return NextResponse.json({
          success: true,
          method: 'sms',
          message: `OTP sent via SMS to +91 ******${cleanPhone.slice(-4)}`
        });
      }

      if (email) {
        await dispatchEmail(
          email,
          'Your Sevikaa Verification Code',
          getMagicLinkOrLoginOtpEmailHtml(generatedOtp, false)
        );

        // Uniform response — never leak isExistingUser/existingRole (account enumeration)
        return NextResponse.json({
          success: true,
          method: 'email',
          message: `OTP sent to ${email.replace(/(.)(.*)(@)/, (_: string, a: string, b: string, c: string) => a + '*'.repeat(b.length) + c)}`
        });
      }

      return NextResponse.json({ error: 'Mobile number or email required' }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // ACTION: VERIFY OTP & PROVISION ACCOUNT (IDEMPOTENT STATE MACHINE)
    // -------------------------------------------------------------------------
    if (action === 'verify') {
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      const targetKey = cleanPhone ? `phone:${cleanPhone}` : `email:${(email || '').toLowerCase().trim()}`;
      const submittedHash = hashOtp((otp || '').trim());

      // P0 #5: Single-Query Atomic UPDATE check-and-consume (Race-Condition & Replay Proof)
      try {
        const consumeRes = await queryDb(
          `UPDATE public.otp_verifications
           SET consumed_at = NOW()
           WHERE target_key = $1
             AND otp_hash = $2
             AND consumed_at IS NULL
             AND (expires_at > (EXTRACT(EPOCH FROM NOW()) * 1000))
             AND (attempt_count IS NULL OR attempt_count < 5)
           RETURNING target_key`,
          [targetKey, submittedHash]
        );

        if (!consumeRes?.rows?.length) {
          // Increment attempt_count on failed code entry
          await queryDb(
            `UPDATE public.otp_verifications SET attempt_count = COALESCE(attempt_count, 0) + 1 WHERE target_key = $1 AND consumed_at IS NULL`,
            [targetKey]
          ).catch(() => {});

          return NextResponse.json({ error: 'Incorrect or expired verification code. Please check and try again.' }, { status: 400 });
        }
      } catch (dbErr: any) {
        console.error('[login-otp] DB OTP verification error:', dbErr?.message);
        return NextResponse.json({ error: 'Authentication service error. Please request a new code.' }, { status: 500 });
      }

      // =========================================================================
      // STATE MACHINE STEP 1: RESOLVE / CREATE CANONICAL AUTH IDENTITY (auth.users)
      // =========================================================================
      let resolvedUserId: string | null = null;
      let userEmail: string | undefined = email ? (email || '').toLowerCase().trim() : undefined;
      let userPhone: string | undefined = cleanPhone ? `+91${cleanPhone}` : undefined;
      let isExistingUser = false;
      let userRole: string = role || 'worker';
      let displayFullName: string | null = null;
      let displaySocietyName: string | null = null;

      const cleanDigits = cleanPhone.slice(-10);

      // Search 1: Search public.profiles
      try {
        const profRes = await queryDb(
          `SELECT p.id, p.email, p.phone, p.role, p.full_name,
                  COALESCE(wp.full_name, p.full_name) AS worker_name,
                  COALESCE(ep.company_name, p.full_name) AS employer_name,
                  COALESCE(wp.preferred_society_name, ep.society_name, '') AS society_name,
                  (wp.id IS NOT NULL OR ep.id IS NOT NULL) AS has_sub_profile,
                  CASE 
                    WHEN ep.id IS NOT NULL THEN 'employer'
                    WHEN wp.id IS NOT NULL THEN 'worker'
                    ELSE p.role 
                  END AS resolved_role
           FROM public.profiles p
           LEFT JOIN public.worker_profiles wp ON wp.user_id = p.id OR wp.id = p.id
           LEFT JOIN public.employer_profiles ep ON ep.user_id = p.id OR ep.id = p.id
           WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(p.phone, ''), '[^0-9]', '', 'g'), 10) = $1)
              OR ($2 <> '' AND LOWER(COALESCE(p.email, '')) = $2)
           LIMIT 1`,
          [cleanDigits, userEmail || '']
        );

        if (profRes?.rows?.length) {
          const row = profRes.rows[0];
          resolvedUserId = row.id;
          isExistingUser = true;
          userRole = row.resolved_role || row.role || userRole;
          userEmail = row.email || userEmail;
          userPhone = row.phone || userPhone;
          displayFullName = row.resolved_role === 'employer'
            ? (row.employer_name || row.full_name || 'Employer Household')
            : (row.worker_name || row.full_name || 'Verified Helper');
          displaySocietyName = row.society_name || null;
        }
      } catch (err) {
        console.warn("[login-otp] Profiles lookup notice:", err);
      }

      // Search 2: If not in profiles, search auth.users directly
      if (!resolvedUserId) {
        try {
          const authRes = await queryDb(
            `SELECT id, email, phone, raw_user_meta_data
             FROM auth.users
             WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1)
                OR ($2 <> '' AND LOWER(COALESCE(email, '')) = $2)
             LIMIT 1`,
            [cleanDigits, userEmail || '']
          );
          if (authRes?.rows?.length) {
            const row = authRes.rows[0];
            resolvedUserId = row.id;
            isExistingUser = true;
            userEmail = row.email || userEmail;
            userPhone = row.phone || userPhone;
            const meta = typeof row.raw_user_meta_data === 'string' ? JSON.parse(row.raw_user_meta_data) : (row.raw_user_meta_data || {});
            if (meta.role && SELF_SELECTABLE_ROLES.has(meta.role)) {
              userRole = meta.role;
            }
          }
        } catch (err) {
          console.warn("[login-otp] auth.users direct lookup notice:", err);
        }
      }

      // Search 3: Create new identity in auth.users if still not found
      if (!resolvedUserId) {
        if (supabaseAdmin) {
          try {
            const { data: createdAuthUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
              phone: userPhone,
              email: userEmail,
              email_confirm: true,
              phone_confirm: true,
              user_metadata: { role: userRole }
            });
            if (createdAuthUser?.user?.id) {
              resolvedUserId = createdAuthUser.user.id;
            } else if (authCreateErr) {
              console.warn("[login-otp] createUser warning:", authCreateErr.message, "— attempting DB lookup");
              try {
                const existingAuthRes = await queryDb(
                  `SELECT id FROM auth.users
                   WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1)
                      OR ($2 <> '' AND LOWER(COALESCE(email, '')) = $2)
                   LIMIT 1`,
                  [cleanDigits, userEmail || '']
                );
                if (existingAuthRes?.rows?.[0]?.id) {
                  resolvedUserId = existingAuthRes.rows[0].id;
                  isExistingUser = true;
                }
              } catch (retryErr) {
                console.warn("[login-otp] auth.users lookup retry error:", retryErr);
              }
            }
          } catch (authErr) {
            console.warn("[login-otp] Supabase auth.createUser exception:", authErr);
          }
        }
      }

      // FAIL CLOSED CASE 5: Auth user creation failure — never issue token or create fake ID
      if (!resolvedUserId) {
        console.error('[login-otp] CRITICAL: Canonical identity creation failed.');
        return NextResponse.json(
          { error: 'Account Creation Failed', message: 'Could not establish canonical user identity.' },
          { status: 500 }
        );
      }

      // =========================================================================
      // STATE MACHINE STEP 2: PROVISION / REPAIR public.profiles (IDEMPOTENT)
      // =========================================================================
      try {
        await queryDb(
          `INSERT INTO public.profiles (id, phone, email, role, status, created_at)
           VALUES ($1, $2, $3, $4, 'pending_review', NOW())
           ON CONFLICT (id) DO UPDATE 
             SET phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
                 email = COALESCE(EXCLUDED.email, public.profiles.email),
                 role = COALESCE(public.profiles.role, EXCLUDED.role)`,
          [resolvedUserId, userPhone || null, userEmail || null, userRole]
        );
      } catch (profErr: any) {
        console.error('[login-otp] Profiles upsert error:', profErr?.message);
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from('profiles').upsert({
              id: resolvedUserId,
              phone: userPhone || null,
              email: userEmail || null,
              role: userRole
            });
          } catch (sbProfErr) {
            console.error('[login-otp] Supabase profiles fallback error:', sbProfErr);
          }
        }
      }

      // VERIFY public.profiles ROW (FAIL CLOSED CASE 6)
      let verifiedProfile: { id: string; role: string; phone?: string; email?: string } | null = null;
      try {
        const checkProf = await queryDb(
          `SELECT id, role, phone, email FROM public.profiles WHERE id = $1 LIMIT 1`,
          [resolvedUserId]
        );
        if (checkProf?.rows?.[0]) {
          verifiedProfile = checkProf.rows[0];
        }
      } catch (checkErr) {
        console.error('[login-otp] Profile verification query failed:', checkErr);
      }

      if (!verifiedProfile) {
        console.error('[login-otp] CRITICAL: Mandatory profiles record missing after provisioning.');
        return NextResponse.json(
          { error: 'Profile Creation Failed', message: 'Failed to establish mandatory user profile record.' },
          { status: 500 }
        );
      }

      const effectiveRole = verifiedProfile.role || userRole;

      // =========================================================================
      // STATE MACHINE STEP 3: PROVISION / REPAIR ROLE SUB-PROFILE (IDEMPOTENT)
      // =========================================================================
      if (effectiveRole === 'worker') {
        // Check if worker_profiles row already exists (e.g. existing worker or completed onboarding)
        let verifiedWp = false;
        try {
          const checkWp = await queryDb(
            `SELECT id FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`,
            [resolvedUserId]
          );
          if (checkWp?.rows?.[0]) {
            verifiedWp = true;
          }
        } catch (checkWpErr) {
          console.error('[login-otp] Worker profile verification query failed:', checkWpErr);
        }

        // If worker_profiles does not exist yet, required fields (gender, age, expected_salary)
        // have not been collected at OTP time. Do NOT fabricate fake values and do NOT issue normal JWT.
        // Issue short-lived onboarding credential and return pending onboarding response.
        if (!verifiedWp) {
          const onboardingToken = signOnboardingJwt(resolvedUserId, userEmail, userPhone, 'worker');
          const isWebClient = req.headers.get('x-client-platform') === 'web' || Boolean(req.headers.get('origin')) || Boolean(req.headers.get('referer'));

          const pendingPayload: any = {
            success: true,
            isExistingUser,
            hasCompletedProfile: false,
            requiresOnboarding: true,
            onboardingUrl: '/worker/onboarding',
            user: {
              id: resolvedUserId,
              email: userEmail,
              phone: userPhone,
              role: 'worker',
              status: 'onboarding_pending'
            },
            message: 'OTP verified. Worker onboarding required before profile activation.'
          };

          // Mobile client receives onboarding_token in JSON body to save in SecureStore.
          // Web client receives onboarding token ONLY via HttpOnly cookie.
          if (!isWebClient) {
            pendingPayload.onboarding_token = onboardingToken;
          }

          const pendingRes = NextResponse.json(pendingPayload);

          if (isWebClient) {
            pendingRes.cookies.set('sevikaa_onboarding_token', onboardingToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 900,
              path: '/'
            });
          }

          return pendingRes;
        }

      } else if (effectiveRole === 'employer') {
        const empName = displayFullName || 'Employer Household';

        // 1. Check if employer_profiles row already exists
        let verifiedEp = false;
        try {
          const checkEp = await queryDb(
            `SELECT id FROM public.employer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`,
            [resolvedUserId]
          );
          if (checkEp?.rows?.[0]) {
            verifiedEp = true;
          }
        } catch (checkEpErr) {
          console.error('[login-otp] Employer profile check query failed:', checkEpErr);
        }

        // 2. If employer_profiles does not exist yet, insert it
        if (!verifiedEp) {
          try {
            await queryDb(
              `INSERT INTO public.employer_profiles (id, user_id, name, company_name, created_at)
               VALUES ($1, $1, $2, $2, NOW())
               ON CONFLICT (id) DO UPDATE
               SET user_id = EXCLUDED.user_id,
                   name = COALESCE(public.employer_profiles.name, EXCLUDED.name),
                   company_name = COALESCE(public.employer_profiles.company_name, EXCLUDED.company_name)`,
              [resolvedUserId, empName]
            );
            verifiedEp = true;
          } catch (epErr: any) {
            console.error('[login-otp] employer_profiles upsert error:', epErr?.message);
            // Fallback: check if row was created or exists via user_id
            const retryEp = await queryDb(
              `SELECT id FROM public.employer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`,
              [resolvedUserId]
            ).catch(() => null);
            if (retryEp?.rows?.[0]) {
              verifiedEp = true;
            }
          }
        }

        if (!verifiedEp) {
          console.error('[login-otp] CRITICAL: Mandatory employer_profiles record missing after provisioning.');
          return NextResponse.json(
            { error: 'Employer Profile Creation Failed', message: 'Failed to establish mandatory employer profile record.' },
            { status: 500 }
          );
        }
      }

      // =========================================================================
      // STATE MACHINE STEP 4: PERSIST REFRESH SESSION
      // =========================================================================
      const { generateRefreshToken, hashRefreshToken } = await import('@/lib/jwtHelper');
      const refreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      let refreshPersisted = false;
      try {
        const refreshInsertRes = await queryDb(
          `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [resolvedUserId, tokenHash, expiresAt]
        );
        if (refreshInsertRes?.rows?.[0]?.id) {
          refreshPersisted = true;
        }
      } catch (dbInsertErr: any) {
        console.error('[login-otp] CRITICAL: Refresh token DB persistence failed:', dbInsertErr?.message);
      }

      // FAIL CLOSED CASE 9: Refresh token persistence failure — never issue tokens
      if (!refreshPersisted) {
        console.error('[login-otp] CRITICAL: Persistent refresh session creation failed.');
        return NextResponse.json(
          { error: 'Authentication Failed', message: 'Failed to establish persistent user session.' },
          { status: 500 }
        );
      }

      // =========================================================================
      // STATE MACHINE STEP 5: FINAL PRE-TOKEN VERIFICATION GATEKEEPER
      // =========================================================================
      // Double check that profiles, role profile, and refresh session row ALL exist in DB
      let finalVerificationPassed = false;
      try {
        const finalGateRes = await queryDb(
          `SELECT 
             (SELECT COUNT(*) FROM public.profiles WHERE id = $1) AS profile_count,
             (CASE 
                WHEN $2 = 'worker' THEN (SELECT COUNT(*) FROM public.worker_profiles WHERE user_id = $1 OR id = $1)
                WHEN $2 = 'employer' THEN (SELECT COUNT(*) FROM public.employer_profiles WHERE user_id = $1 OR id = $1)
                ELSE 1
              END) AS role_profile_count,
             (SELECT COUNT(*) FROM public.refresh_tokens WHERE user_id = $1 AND token_hash = $3 AND is_revoked = FALSE AND expires_at > NOW()) AS session_count`,
          [resolvedUserId, effectiveRole, tokenHash]
        );

        const counts = finalGateRes?.rows?.[0];
        if (
          counts &&
          parseInt(counts.profile_count, 10) > 0 &&
          parseInt(counts.role_profile_count, 10) > 0 &&
          parseInt(counts.session_count, 10) > 0
        ) {
          finalVerificationPassed = true;
        }
      } catch (gateErr) {
        console.error('[login-otp] Final gatekeeper query error:', gateErr);
      }

      if (!finalVerificationPassed) {
        console.error('[login-otp] CRITICAL: Final pre-token verification gatekeeper failed.');
        // Revoke the unverified refresh token entry if created
        await queryDb(`DELETE FROM public.refresh_tokens WHERE token_hash = $1`, [tokenHash]).catch(() => {});
        return NextResponse.json(
          { error: 'Account Verification Failed', message: 'Incomplete account provisioning detected.' },
          { status: 500 }
        );
      }

      // =========================================================================
      // STATE MACHINE STEP 6: ISSUE ACCESS TOKEN & LOGIN RESPONSE (ONLY ON PASS)
      // =========================================================================
      const accessToken = signSupabaseJwt(resolvedUserId, userEmail, userPhone, effectiveRole);

      const userObj = {
        id: resolvedUserId,
        email: userEmail,
        phone: userPhone,
        role: effectiveRole,
        full_name: displayFullName || (effectiveRole === 'employer' ? 'Employer Household' : 'Verified Helper'),
        society: displaySocietyName || ''
      };

      const isWebClient = req.headers.get('x-client-platform') === 'web' || Boolean(req.headers.get('origin')) || Boolean(req.headers.get('referer'));

      const res = NextResponse.json({
        success: true,
        user: userObj,
        session: {
          access_token: accessToken,
          ...(isWebClient ? {} : { refresh_token: refreshToken }),
          token_type: 'bearer',
          user: userObj,
        },
        token: accessToken,
        access_token: accessToken,
        ...(isWebClient ? {} : { refresh_token: refreshToken }),
        isExistingUser,
        hasCompletedProfile: true
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

      if (accessToken) {
        res.cookies.set('sevikaa_access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600,
          path: '/'
        });
      }

      if (effectiveRole) {
        res.cookies.set('sevikaa_user_role', effectiveRole, {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax'
        });
      }

      if (resolvedUserId) {
        res.cookies.set('sevikaa_user_id', resolvedUserId, {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax'
        });
      }

      return res;
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    console.error("Login OTP API route error:", err);
    return NextResponse.json({ error: err.message || 'Server error processing request' }, { status: 500 });
  }
}
