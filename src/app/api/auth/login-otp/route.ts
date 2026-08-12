import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { sendEmail as dispatchEmail, sendSMS } from '@/lib/notifications';
import { getMagicLinkOrLoginOtpEmailHtml } from '@/lib/emailTemplates';
import crypto from 'crypto';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';
import { signSupabaseJwt } from '@/lib/jwtHelper';

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
        // Check send rate limit: max 3 sends per hour per target
        const rateRes = await queryDb(
          `SELECT send_count, last_sent_at FROM public.otp_verifications WHERE target_key = $1`,
          [targetKey]
        );
        const existing = rateRes?.rows?.[0];
        if (existing) {
          const lastSentAt = existing.last_sent_at ? new Date(existing.last_sent_at).getTime() : 0;
          const withinHour = Date.now() - lastSentAt < 60 * 60 * 1000;
          if (withinHour && (existing.send_count || 0) >= 3) {
            return NextResponse.json({ error: 'Too many OTP requests. Please wait before requesting another code.' }, { status: 429 });
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
                 WHEN EXTRACT(EPOCH FROM (NOW() - public.otp_verifications.last_sent_at)) > 3600
                 THEN 1
                 ELSE public.otp_verifications.send_count + 1
               END,
               last_sent_at = NOW()`,
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

        // Item 21: Uniform response — never leak isExistingUser/existingRole (account enumeration)
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

        // Item 21: Uniform response — never leak isExistingUser/existingRole (account enumeration)
        return NextResponse.json({
          success: true,
          method: 'email',
          message: `OTP sent to ${email.replace(/(.)(.*)(@)/, (_: string, a: string, b: string, c: string) => a + '*'.repeat(b.length) + c)}`
        });
      }

      return NextResponse.json({ error: 'Mobile number or email required' }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // ACTION: VERIFY OTP
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
             AND expires_at > NOW()
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

      // Fetch or Create user profile in Supabase
      let userObj: { id: string; phone?: string; email?: string; role?: string; full_name?: string; society?: string } | null = null;
      let isExistingUser = false;
      let hasCompletedProfile = false;
      const formattedPhone = cleanPhone ? `+91${cleanPhone}` : undefined;

      try {
        const cleanDigits = cleanPhone.slice(-10);
        const searchEmail = (email || '').toLowerCase().trim();

        // 1. Query public.profiles and sub-profile existence & resolved role
        const dbRes = await queryDb(
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
          [cleanDigits, searchEmail]
        );

        if (dbRes && dbRes.rows.length > 0) {
          const prof = dbRes.rows[0];
          isExistingUser = true;
          hasCompletedProfile = !!prof.has_sub_profile;
          const resolvedName = prof.resolved_role === 'employer' 
            ? (prof.employer_name || prof.full_name || 'Employer Household') 
            : (prof.worker_name || prof.full_name || 'Verified Helper');
          userObj = {
            id: prof.id,
            email: prof.email || email,
            phone: prof.phone || formattedPhone,
            role: prof.resolved_role || prof.role || 'worker',
            full_name: resolvedName,
            society: prof.society_name || ''
          };
        }
      } catch (err) {
        console.warn("DB user lookup notice:", err);
      }

      // If not found in public.profiles, check Supabase Admin Auth
      // If not found in public.profiles, query auth.users directly via SQL (scalable, no listUsers scan)
      if (!userObj) {
        try {
          const authUserRes = await queryDb(
            `SELECT id, email, phone, raw_user_meta_data
             FROM auth.users
             WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1)
                OR ($2 <> '' AND LOWER(COALESCE(email, '')) = $2)
             LIMIT 1`,
            [cleanPhone ? cleanPhone.slice(-10) : '', (email || '').toLowerCase().trim()]
          );
          if (authUserRes?.rows?.[0]) {
            const foundUser = authUserRes.rows[0];
            const meta = typeof foundUser.raw_user_meta_data === 'string' ? JSON.parse(foundUser.raw_user_meta_data) : (foundUser.raw_user_meta_data || {});
            isExistingUser = true;
            userObj = {
              id: foundUser.id,
              email: foundUser.email || email,
              phone: foundUser.phone || formattedPhone,
              role: meta.role || role || 'worker'
            };
          }
        } catch (adminSearchErr) {
          console.warn("Auth users direct lookup notice:", adminSearchErr);
        }
      }

      // 2. Create new user if still not found
      if (!userObj) {
        const userRole = role || 'worker';
        let createdUserId: string | null = null;

        // Create official auth.users record via Supabase Admin Client to satisfy profiles_id_fkey constraint
        if (supabaseAdmin) {
          try {
            const { data: createdAuthUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
              phone: formattedPhone || undefined,
              email: email || undefined,
              email_confirm: true,
              phone_confirm: true,
              user_metadata: { role: userRole }
            });
            if (createdAuthUser?.user?.id) {
              createdUserId = createdAuthUser.user.id;
            } else if (authCreateErr) {
              console.warn("createUser notice:", authCreateErr.message, "— fetching existing auth user id via DB");
              try {
                const existingAuthRes = await queryDb(
                  `SELECT id FROM auth.users
                   WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1)
                      OR ($2 <> '' AND LOWER(COALESCE(email, '')) = $2)
                   LIMIT 1`,
                  [cleanPhone ? cleanPhone.slice(-10) : '', (email || '').toLowerCase().trim()]
                );
                if (existingAuthRes?.rows?.[0]?.id) {
                  createdUserId = existingAuthRes.rows[0].id;
                  isExistingUser = true;
                }
              } catch (listErr) {
                console.warn("Auth user DB lookup notice:", listErr);
              }
            }
          } catch (authErr) {
            console.warn("Supabase auth user create notice:", authErr);
          }
        }

        // Fail closed if new user creation failed and no canonical auth.users ID was resolved
        if (!createdUserId) {
          console.error('[login-otp] CRITICAL: Auth user creation failed and no canonical identity found.');
          return NextResponse.json({ error: 'Account Creation Failed', message: 'Could not establish canonical user identity.' }, { status: 500 });
        }

        userObj = {
          id: createdUserId,
          phone: formattedPhone,
          email: email || undefined,
          role: userRole
        };
      }

      // -----------------------------------------------------------------------
      // MANDATORY PROFILE & ROLE SUB-PROFILE ESTABLISHMENT (FAIL CLOSED)
      // -----------------------------------------------------------------------
      const resolvedId = userObj.id;
      const userRole = userObj.role || role || 'worker';
      const displayPhone = formattedPhone || userObj.phone || null;
      const displayEmail = email || userObj.email || null;

      // 1. Establish public.profiles row
      let profInserted = false;
      try {
        await queryDb(
          `INSERT INTO public.profiles (id, phone, email, role, status, created_at)
           VALUES ($1, $2, $3, $4, 'pending_review', NOW())
           ON CONFLICT (id) DO UPDATE 
             SET phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
                 email = COALESCE(EXCLUDED.email, public.profiles.email),
                 role = COALESCE(public.profiles.role, EXCLUDED.role)`,
          [resolvedId, displayPhone, displayEmail, userRole]
        );
        profInserted = true;
      } catch (profUpsertErr: any) {
        console.error('[login-otp] Profile upsert error:', profUpsertErr?.message);
        if (supabaseAdmin) {
          try {
            const { error: sbProfErr } = await supabaseAdmin.from('profiles').upsert({
              id: resolvedId,
              phone: displayPhone,
              email: displayEmail,
              role: userRole
            });
            if (!sbProfErr) profInserted = true;
          } catch (sbErr) {
            console.error('[login-otp] Supabase profiles fallback error:', sbErr);
          }
        }
      }

      if (!profInserted && !isExistingUser) {
        console.error('[login-otp] CRITICAL: Mandatory profile creation failed for new user.');
        return NextResponse.json({ error: 'Profile Creation Failed', message: 'Failed to establish mandatory user profile record.' }, { status: 500 });
      }

      // 2. Establish mandatory worker_profiles or employer_profiles sub-profile
      let subProfileEstablished = false;
      if (userRole === 'worker') {
        try {
          await queryDb(
            `INSERT INTO public.worker_profiles (id, user_id, full_name, created_at)
             VALUES ($1, $1, $2, NOW())
             ON CONFLICT (id) DO NOTHING`,
            [resolvedId, 'Worker Candidate']
          );
          subProfileEstablished = true;
        } catch (wpStubErr: any) {
          console.error('[login-otp] Worker sub-profile creation error:', wpStubErr?.message);
          if (supabaseAdmin) {
            try {
              const { error: sbWpErr } = await supabaseAdmin.from('worker_profiles').upsert({
                id: resolvedId,
                user_id: resolvedId,
                full_name: 'Worker Candidate'
              });
              if (!sbWpErr) subProfileEstablished = true;
            } catch (sbWpExc) {}
          }
        }
      } else if (userRole === 'employer') {
        try {
          await queryDb(
            `INSERT INTO public.employer_profiles (id, user_id, company_name, created_at)
             VALUES ($1, $1, $2, NOW())
             ON CONFLICT (id) DO NOTHING`,
            [resolvedId, 'Employer Candidate']
          );
          subProfileEstablished = true;
        } catch (epStubErr: any) {
          console.error('[login-otp] Employer sub-profile creation error:', epStubErr?.message);
          if (supabaseAdmin) {
            try {
              const { error: sbEpErr } = await supabaseAdmin.from('employer_profiles').upsert({
                id: resolvedId,
                user_id: resolvedId,
                company_name: 'Employer Candidate'
              });
              if (!sbEpErr) subProfileEstablished = true;
            } catch (sbEpExc) {}
          }
        }
      } else {
        subProfileEstablished = true;
      }

      if (!subProfileEstablished && !isExistingUser) {
        console.error('[login-otp] CRITICAL: Mandatory role profile creation failed for new user.');
        return NextResponse.json({ error: 'Role Profile Creation Failed', message: 'Failed to establish mandatory candidate/employer profile record.' }, { status: 500 });
      }

      // Generate cryptographically signed HS256 JWT access_token and rotatable refresh_token
      const accessToken = signSupabaseJwt(resolvedId, userObj.email, userObj.phone, userRole);
      const { generateRefreshToken, hashRefreshToken } = await import('@/lib/jwtHelper');
      const refreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      try {
        await queryDb(
          `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [resolvedId, tokenHash, expiresAt]
        );
      } catch (dbInsertErr: any) {
        console.error('[login-otp] CRITICAL: Refresh token DB persistence failed:', dbInsertErr?.message);
        return NextResponse.json({ error: 'Authentication Failed', message: 'Failed to establish persistent user session.' }, { status: 500 });
      }

      const isWebClient = req.headers.get('x-client-platform') === 'web' || Boolean(req.headers.get('origin')) || Boolean(req.headers.get('referer'));

      // Prepare response payload: Web receives HttpOnly cookie exclusively, Mobile gets refresh_token in JSON
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
        hasCompletedProfile
      });

      // Set Web HttpOnly refresh token cookie
      if (refreshToken) {
        res.cookies.set('sevikaa_refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/'
        });
      }

      if (userObj?.role) {
        res.cookies.set('sevikaa_user_role', userObj.role, {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax'
        });
      }

      if (userObj?.id) {
        res.cookies.set('sevikaa_user_id', userObj.id, {
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
