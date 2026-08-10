import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { sendSMS } from '@/lib/notifications';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    const sbCookie = Array.from(request.cookies.getAll()).find(c =>
      c.name.includes('auth-token') || c.name.includes('access-token') || c.name.endsWith('-auth-token')
    );
    if (sbCookie?.value) {
      try {
        const parsed = JSON.parse(sbCookie.value);
        token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null) || sbCookie.value;
      } catch { token = sbCookie.value; }
    }
  }

  if (!token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — account deletion is an authenticated action
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to delete account.' }, { status: 401 });
    }

    // Identity from auth.uid() — never from body
    const authenticatedUserId = user.id;

    const body = await req.json();
    const { action, otp, reason } = body;

    // 2. Fetch verified phone from DB — never trust the client
    let targetPhone = '';
    try {
      const uRes = await queryDb(`SELECT phone FROM public.profiles WHERE id = $1 LIMIT 1`, [authenticatedUserId]);
      if (uRes?.rows?.[0]?.phone) {
        targetPhone = uRes.rows[0].phone.replace(/\D/g, '').slice(-10);
      }
    } catch (e) {
      console.warn("Phone fetch notice:", e);
    }

    const targetKey = `delete:${authenticatedUserId}`;

    // -------------------------------------------------------------------------
    // ACTION: SEND DELETION OTP
    // -------------------------------------------------------------------------
    if (action === 'send') {
      if (!targetPhone) {
        return NextResponse.json({ error: 'No verified phone number on record for this account.' }, { status: 400 });
      }

      // Check send rate limit: max 3 sends per hour
      try {
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
      } catch (rateErr) {
        console.warn("Rate limit check notice:", rateErr);
      }

      // Generate cryptographically secure OTP — hash before storing
      const generatedOtp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = hashOtp(generatedOtp);
      const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes

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

      // Dispatch SMS (fall back to LOGIN_OTP template if dedicated template not registered)
      try {
        await sendSMS(targetPhone, 'DELETE_ACCOUNT_OTP', { otp: generatedOtp });
      } catch (smsErr) {
        console.warn("Delete account OTP SMS notice:", smsErr);
        try {
          await sendSMS(targetPhone, 'LOGIN_OTP', { otp: generatedOtp });
        } catch (fallbackErr) {
          console.warn("Fallback SMS notice:", fallbackErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deletion verification OTP sent to +91 ******${targetPhone.slice(-4)}.`
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: VERIFY DELETION OTP & MARK ACCOUNT FOR DELETION
    // -------------------------------------------------------------------------
    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: '6-Digit OTP code is required' }, { status: 400 });
      }

      const dbRes = await queryDb(
        `SELECT otp_hash, expires_at, attempt_count, consumed_at
         FROM public.otp_verifications WHERE target_key = $1`,
        [targetKey]
      );
      const record = dbRes?.rows?.[0];

      if (!record) {
        return NextResponse.json({ error: 'OTP not found or expired. Please request a new code.' }, { status: 400 });
      }

      if (record.consumed_at) {
        return NextResponse.json({ error: 'This OTP has already been used. Please request a new code.' }, { status: 400 });
      }

      if ((record.attempt_count || 0) >= 5) {
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP code.' }, { status: 429 });
      }

      if (Date.now() > Number(record.expires_at)) {
        await queryDb(`DELETE FROM public.otp_verifications WHERE target_key = $1`, [targetKey]).catch(() => {});
        return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
      }

      const submittedHash = hashOtp(otp.trim());
      if (!crypto.timingSafeEqual(Buffer.from(submittedHash, 'hex'), Buffer.from(record.otp_hash, 'hex'))) {
        await queryDb(
          `UPDATE public.otp_verifications SET attempt_count = attempt_count + 1 WHERE target_key = $1`,
          [targetKey]
        ).catch(() => {});
        return NextResponse.json({ error: 'Invalid OTP code. Please check and re-enter.' }, { status: 400 });
      }

      // Mark OTP as consumed (single-use)
      await queryDb(
        `UPDATE public.otp_verifications SET consumed_at = NOW() WHERE target_key = $1`,
        [targetKey]
      ).catch(() => {});

      const finalReason = reason || 'User initiated offboarding';

      // Mark authenticated user's account for deletion
      await queryDb(
        `UPDATE public.profiles SET status = 'pending_deletion' WHERE id = $1`,
        [authenticatedUserId]
      );

      await queryDb(
        `UPDATE public.employer_profiles SET status = 'pending_deletion' WHERE user_id = $1 OR id = $1`,
        [authenticatedUserId]
      ).catch(() => {});

      await queryDb(
        `UPDATE public.worker_profiles SET status = 'pending_deletion' WHERE user_id = $1 OR id = $1`,
        [authenticatedUserId]
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Account deletion request verified and submitted to Admin for final review.'
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (err: any) {
    console.error("Delete account OTP API error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
