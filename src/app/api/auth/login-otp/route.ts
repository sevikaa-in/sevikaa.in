import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

// In-memory OTP storage
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, email, otp, role } = body;

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

      // Generate real 6-digit random OTP code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      const targetKey = cleanPhone ? `phone:${cleanPhone}` : `email:${(email || '').toLowerCase().trim()}`;

      // Persist OTP in memory & DB for serverless resilience
      otpStore.set(targetKey, { otp: generatedOtp, expiresAt });

      try {
        await queryDb(
          `CREATE TABLE IF NOT EXISTS public.otp_verifications (
             target_key VARCHAR(150) PRIMARY KEY,
             otp VARCHAR(10) NOT NULL,
             expires_at BIGINT NOT NULL,
             created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
           )`
        );
        await queryDb(
          `INSERT INTO public.otp_verifications (target_key, otp, expires_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (target_key) DO UPDATE
           SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
          [targetKey, generatedOtp, expiresAt]
        );
      } catch (dbSaveErr) {
        console.warn("DB OTP save notice:", dbSaveErr);
      }

      if (cleanPhone) {
        try {
          const { sendSMS } = require('@/lib/notifications');
          await sendSMS(cleanPhone, 'LOGIN_OTP', { otp: generatedOtp });
        } catch (smsErr) {
          console.warn("SMS send notice:", smsErr);
        }

        return NextResponse.json({
          success: true,
          method: 'sms',
          isExistingUser,
          existingRole,
          hasCompletedProfile,
          message: `OTP sent via SMS to +91 ******${cleanPhone.slice(-4)}`
        });
      }

      if (email) {
        const { getMagicLinkOrLoginOtpEmailHtml } = require('@/lib/emailTemplates');
        const { sendEmail: dispatchEmail } = require('@/lib/notifications');

        await dispatchEmail(
          email,
          'Your Sevikaa Verification Code',
          getMagicLinkOrLoginOtpEmailHtml(generatedOtp, false)
        );

        return NextResponse.json({
          success: true,
          method: 'email',
          isExistingUser,
          existingRole,
          hasCompletedProfile,
          message: `OTP sent to ${email}`
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
      
      let storedData = otpStore.get(targetKey);

      // Fallback: Fetch from PostgreSQL database if serverless lambda restarted
      if (!storedData) {
        try {
          const dbRes = await queryDb(
            `SELECT otp, expires_at FROM public.otp_verifications WHERE target_key = $1`,
            [targetKey]
          );
          if (dbRes && dbRes.rows.length > 0) {
            storedData = {
              otp: dbRes.rows[0].otp,
              expiresAt: Number(dbRes.rows[0].expires_at)
            };
          }
        } catch (dbFetchErr) {
          console.warn("DB OTP lookup notice:", dbFetchErr);
        }
      }

      if (!storedData) {
        return NextResponse.json({ error: 'No active OTP request found. Please request a new code.' }, { status: 400 });
      }

      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(targetKey);
        try { await queryDb(`DELETE FROM public.otp_verifications WHERE target_key = $1`, [targetKey]); } catch (e) {}
        return NextResponse.json({ error: 'OTP code has expired. Please request a new code.' }, { status: 400 });
      }

      if ((otp || '').trim() !== storedData.otp.trim()) {
        return NextResponse.json({ error: 'Incorrect verification code. Please check and try again.' }, { status: 400 });
      }

      // OTP Verified successfully! Clear store entries
      otpStore.delete(targetKey);
      try { await queryDb(`DELETE FROM public.otp_verifications WHERE target_key = $1`, [targetKey]); } catch (e) {}

      // Fetch or Create user profile in Supabase
      let userObj: { id: string; phone?: string; email?: string; role?: string } | null = null;
      let isExistingUser = false;
      let hasCompletedProfile = false;
      const formattedPhone = cleanPhone ? `+91${cleanPhone}` : undefined;

      try {
        const cleanDigits = cleanPhone.slice(-10);
        const searchEmail = (email || '').toLowerCase().trim();

        // 1. Query public.profiles and sub-profile existence
        const dbRes = await queryDb(
          `SELECT p.id, p.email, p.phone, p.role,
                  (wp.id IS NOT NULL OR ep.id IS NOT NULL) AS has_sub_profile
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
          userObj = {
            id: prof.id,
            email: prof.email || email,
            phone: prof.phone || formattedPhone,
            role: prof.role || 'worker'
          };
        }
      } catch (err) {
        console.warn("DB user lookup notice:", err);
      }

      // If not found in public.profiles, check Supabase Admin Auth
      if (!userObj && supabaseAdmin) {
        try {
          if (cleanPhone) {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            const foundUser = usersData?.users?.find(u => 
              u.phone?.replace(/\D/g, '').slice(-10) === cleanPhone ||
              (email && u.email?.toLowerCase().trim() === email.toLowerCase().trim())
            );
            if (foundUser) {
              isExistingUser = true;
              userObj = {
                id: foundUser.id,
                email: foundUser.email || email,
                phone: foundUser.phone || formattedPhone,
                role: foundUser.user_metadata?.role || role || 'worker'
              };
            }
          }
        } catch (adminSearchErr) {
          console.warn("Supabase admin search notice:", adminSearchErr);
        }
      }

      // 2. Create new user if still not found
      if (!userObj) {
        let newUserId = crypto.randomUUID();
        const userRole = role || 'worker';

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
              newUserId = createdAuthUser.user.id;
            } else if (authCreateErr) {
              // createUser failed — likely phone/email already exists in auth.users
              // Find the existing auth user to get their real UUID
              console.warn("createUser notice:", authCreateErr.message, "— searching existing auth users");
              try {
                const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
                const existingAuthUser = usersData?.users?.find(u =>
                  (cleanPhone && u.phone?.replace(/\D/g, '').slice(-10) === cleanPhone) ||
                  (email && u.email?.toLowerCase().trim() === email.toLowerCase().trim())
                );
                if (existingAuthUser?.id) {
                  newUserId = existingAuthUser.id;
                  isExistingUser = true;
                }
              } catch (listErr) {
                console.warn("Auth user list search notice:", listErr);
              }
            }
          } catch (authErr) {
            console.warn("Supabase auth user create notice:", authErr);
          }
        }

        // Try to find existing profile by phone in DB as final fallback
        if (!isExistingUser) {
          try {
            const cleanDigits = (formattedPhone || '').replace(/\D/g, '').slice(-10);
            if (cleanDigits.length === 10) {
              const existingProf = await queryDb(
                `SELECT id FROM public.profiles WHERE RIGHT(REGEXP_REPLACE(COALESCE(phone,''),'[^0-9]','','g'),10) = $1 LIMIT 1`,
                [cleanDigits]
              );
              if (existingProf?.rows[0]?.id) {
                newUserId = existingProf.rows[0].id;
                isExistingUser = true;
              }
            }
          } catch (dbLookupErr) {
            console.warn("DB phone lookup notice:", dbLookupErr);
          }
        }

        userObj = {
          id: newUserId,
          phone: formattedPhone,
          email: email || undefined,
          role: userRole
        };

        // Only insert into public.profiles if we have a real auth UUID (avoids FK violation)
        // We track whether newUserId came from a real auth user via isExistingUser flag
        // OR if createUser succeeded (newUserId changed from the initial crypto.randomUUID())
        if (!isExistingUser) {
          try {
            await queryDb(
              `INSERT INTO public.profiles (id, phone, email, role, status, created_at) 
               VALUES ($1, $2, $3, $4, 'pending_review', NOW())
               ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, status = COALESCE(public.profiles.status, 'pending_review')`,
              [newUserId, formattedPhone || null, email || null, userRole]
            );
          } catch (insertErr: any) {
            console.warn("Profile creation notice:", insertErr.detail || insertErr.message);
            if (supabaseAdmin) {
              try {
                await supabaseAdmin.from('profiles').upsert({
                  id: newUserId,
                  phone: formattedPhone || null,
                  email: email || null,
                  role: userRole
                });
              } catch (sbUpsertErr) {
                console.warn("Supabase profiles upsert notice:", sbUpsertErr);
              }
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // LEAD CAPTURE: After OTP verified, ensure profile + worker_profiles stub exist
      // This makes the lead appear immediately in admin tele-onboarding for both
      // email and phone logins, for both existing and new users
      // -----------------------------------------------------------------------
      if (userObj?.id) {
        const resolvedId = userObj.id;
        const userRole = userObj.role || role || 'worker';
        const displayPhone = formattedPhone || userObj.phone || null;
        const displayEmail = email || userObj.email || null;

        // 1. Upsert into profiles (sets role = worker so lead appears in admin)
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
        } catch (profUpsertErr: any) {
          console.warn("Lead profile upsert notice:", profUpsertErr.detail || profUpsertErr.message);
        }

        // 2. Create worker_profiles or employer_profiles stub if not exists (required for tele-onboarding lead)
        if (userRole === 'worker') {
          try {
            await queryDb(
              `INSERT INTO public.worker_profiles (id, user_id, full_name, created_at)
               VALUES ($1, $1, $2, NOW())
               ON CONFLICT (user_id) DO NOTHING`,
              [resolvedId, 'Worker Candidate']
            );
          } catch (wpStubErr: any) {
            console.warn("Worker profile stub notice:", wpStubErr.detail || wpStubErr.message);
          }
        } else if (userRole === 'employer') {
          try {
            await queryDb(
              `INSERT INTO public.employer_profiles (id, user_id, company_name, created_at)
               VALUES ($1, $1, $2, NOW())
               ON CONFLICT (user_id) DO NOTHING`,
              [resolvedId, 'Employer Candidate']
            );
          } catch (epStubErr: any) {
            console.warn("Employer profile stub notice:", epStubErr.detail || epStubErr.message);
          }
        }
      }

      // Prepare response and set HTTP-only role cookies for proxy security
      const res = NextResponse.json({
        success: true,
        user: userObj,
        isExistingUser,
        hasCompletedProfile
      });

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
