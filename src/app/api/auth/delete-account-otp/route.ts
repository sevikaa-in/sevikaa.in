import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { sendSMS } from '@/lib/notifications';

// In-memory OTP storage for deletion verification
const deleteOtpStore = new Map<string, { otp: string; expiresAt: number; reason?: string }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, phone, otp, reason } = body;

    if (!userId && !phone) {
      return NextResponse.json({ error: 'User ID or phone number is required' }, { status: 400 });
    }

    let targetPhone = (phone || '').replace(/\D/g, '').slice(-10);

    // Fetch phone from DB if only userId provided
    if (!targetPhone && userId) {
      try {
        const uRes = await queryDb(`SELECT phone FROM public.profiles WHERE id = $1 LIMIT 1`, [userId]);
        if (uRes && uRes.rows.length > 0 && uRes.rows[0].phone) {
          targetPhone = uRes.rows[0].phone.replace(/\D/g, '').slice(-10);
        }
      } catch (e) {}
    }

    const key = userId || targetPhone;

    // -------------------------------------------------------------------------
    // ACTION: SEND DELETION OTP
    // -------------------------------------------------------------------------
    if (action === 'send') {
      if (!targetPhone) {
        return NextResponse.json({ error: 'Valid phone number not found for account' }, { status: 400 });
      }

      // Generate 6-digit OTP code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      deleteOtpStore.set(key, { otp: generatedOtp, expiresAt, reason: reason || 'Not specified' });

      // Dispatch SMS using DELETE_ACCOUNT_OTP (falls back gracefully to LOGIN_OTP if template pending)
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
        message: `Deletion verification OTP sent to +91 ${targetPhone.slice(0, 2)}******${targetPhone.slice(-2)}.`
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: VERIFY DELETION OTP & SUBMIT DELETION REQUEST
    // -------------------------------------------------------------------------
    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: '6-Digit OTP code is required' }, { status: 400 });
      }

      const record = deleteOtpStore.get(key);
      if (!record) {
        return NextResponse.json({ error: 'OTP expired or not requested. Please click resend.' }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        deleteOtpStore.delete(key);
        return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 400 });
      }

      if (record.otp !== otp.trim()) {
        return NextResponse.json({ error: 'Invalid 6-Digit OTP code. Please check and re-enter.' }, { status: 400 });
      }

      // OTP is valid! Mark profile as pending_deletion in public.profiles & worker/employer profiles
      deleteOtpStore.delete(key);

      const finalReason = reason || record.reason || 'User initiated offboarding';

      try {
        await queryDb(
          `UPDATE public.profiles 
           SET status = 'pending_deletion' 
           WHERE id = $1 OR RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\\D', 'g'), 10) = $2`,
          [userId || null, targetPhone]
        );

        // Also update sub-profiles
        await queryDb(
          `UPDATE public.worker_profiles 
           SET status = 'pending_deletion' 
           WHERE user_id = $1 OR id = $1`,
          [userId || null]
        );
        await queryDb(
          `UPDATE public.employer_profiles 
           SET status = 'pending_deletion' 
           WHERE user_id = $1 OR id = $1`,
          [userId || null]
        );
      } catch (dbErr) {
        console.warn("Account deletion DB status notice:", dbErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Account deletion request verified and submitted to Admin for final verdict.'
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (err: any) {
    console.error("Delete account OTP API error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
