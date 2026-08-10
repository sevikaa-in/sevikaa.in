import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { queryDb } from '@/lib/db';
import { sendEmail } from '@/lib/notifications';
import { sendSMSWithTemplates } from '@/lib/smsService';
import crypto from 'crypto';

// NOTE: emailMemoryStore is a transitional in-process cache for the multi-step email-change OTP flow.
// TODO: migrate to otp_verifications DB table when multi-step session is redesigned.
// The dangerous 'ORDER BY updated_at DESC LIMIT 1' auth fallback has been removed above.
const emailMemoryStore = new Map<string, {
  userId: string;
  currentEmail: string;
  currentPhone: string;
  newEmail: string;
  oldOtp: string;
  newOtp: string;
  expiresAt: number;
  verified: boolean;
}>();

// Helper to extract & verify user from Bearer Token — fails 401 if no valid token
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data: { user } } = await tempClient.auth.getUser(token);
      if (user?.id) return user;
    } catch (err) {
      // token parse failed — fall through to null
    }
  }

  // No dev fallback: authentication failure must always be 401
  // Never fall back to 'find latest profile' — that is a critical security bug
  return null;
}

// Generate cryptographically secure 6-digit OTP
function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// Mask email for security display (e.g. "sah***@gmail.com")
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const parts = email.split('@');
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 3 ? `${name.slice(0, 3)}***` : `${name.slice(0, 1)}***`;
  return `${maskedName}@${domain}`;
}

// Mask phone for security display (e.g. "+91 ******7627")
function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '').slice(-10);
  if (cleaned.length < 10) return phone;
  return `+91 ******${cleaned.slice(-4)}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // -------------------------------------------------------------------------
    // ACTION: STEP 1 - REQUEST SECURITY OTP (Sent to Current Mobile / Email)
    // -------------------------------------------------------------------------
    if (action === 'request-step1-otp') {
      const { newEmail } = body;
      const cleanNewEmail = (newEmail || '').trim().toLowerCase();

      if (!cleanNewEmail || !cleanNewEmail.includes('@')) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
      }

      // Fetch user's current profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('phone, email, name')
        .eq('id', user.id)
        .maybeSingle();

      const currentEmail = profile?.email || user.email || user.user_metadata?.email || '';
      const cleanCurrentPhone = (profile?.phone || user.phone || '').replace(/\D/g, '').slice(-10);

      if (currentEmail && currentEmail.toLowerCase() === cleanNewEmail) {
        return NextResponse.json({ error: 'New email address must be different from your current email' }, { status: 400 });
      }

      // Check if new email is already registered to another account
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', cleanNewEmail)
        .neq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json({ error: 'This email address is already registered with another Sevikaa account' }, { status: 400 });
      }

      const oldOtp = generateOtp();
      const requestId = crypto.randomUUID();
      const expiresAtMs = Date.now() + 10 * 60 * 1000;

      let oldContactMaskedLabel = '';
      if (cleanCurrentPhone) {
        await sendSMSWithTemplates({
          templateKey: 'LOGIN_OTP',
          phoneNumber: cleanCurrentPhone,
          variables: { otp: oldOtp },
          userId: user.id
        });
        oldContactMaskedLabel = maskPhone(cleanCurrentPhone);
      } else if (currentEmail) {
        await sendEmail(
          currentEmail,
          'Sevikaa Email Update Security Code',
          `<h2>Sevikaa Email Update Security Code</h2><p>Your security verification code to update your account email is:</p><h1 style="font-size:28px;color:#1A73E8;">${oldOtp}</h1><p>Valid for 10 minutes. Do not share this code with anyone.</p>`
        );
        oldContactMaskedLabel = maskEmail(currentEmail);
      } else {
        oldContactMaskedLabel = 'Registered Contact';
      }

      emailMemoryStore.set(requestId, {
        userId: user.id,
        currentEmail,
        currentPhone: cleanCurrentPhone,
        newEmail: cleanNewEmail,
        oldOtp,
        newOtp: '',
        expiresAt: expiresAtMs,
        verified: false
      });

      console.log(`[EMAIL CHANGE OTP 1 DISPATCHED] User: ${user.id} | Target: ${oldContactMaskedLabel}`);

      return NextResponse.json({
        success: true,
        requestId,
        oldContactMasked: oldContactMaskedLabel,
        message: `Security OTP dispatched to ${oldContactMaskedLabel}`
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: STEP 1 - VERIFY SECURITY OTP & INSTANTLY AUTO-DISPATCH NEW EMAIL OTP
    // -------------------------------------------------------------------------
    if (action === 'verify-step1-otp') {
      const { requestId, oldOtp } = body;
      const reqData = emailMemoryStore.get(requestId);

      if (!reqData || reqData.userId !== user.id) {
        return NextResponse.json({ error: 'Invalid or expired verification session' }, { status: 400 });
      }

      if (Date.now() > reqData.expiresAt) {
        emailMemoryStore.delete(requestId);
        return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
      }

      if ((oldOtp || '').trim() !== reqData.oldOtp.trim()) {
        return NextResponse.json({ error: 'Incorrect security OTP. Please check and try again.' }, { status: 400 });
      }

      reqData.verified = true;

      // Instantly generate OTP 2 & dispatch to NEW email address via Amazon SES
      const newOtp = generateOtp();
      reqData.newOtp = newOtp;

      const emailRes = await sendEmail(
        reqData.newEmail,
        'Sevikaa Verify New Email Address',
        `<h2>Verify Your New Sevikaa Email Address</h2><p>Your verification code to confirm <strong>${reqData.newEmail}</strong> as your new Sevikaa account email is:</p><h1 style="font-size:28px;color:#1A73E8;">${newOtp}</h1><p>Valid for 10 minutes. Do not share this code with anyone.</p>`
      );

      emailMemoryStore.set(requestId, reqData);

      console.log(`[EMAIL CHANGE OTP 2 AUTO DISPATCHED] User: ${user.id}`);

      return NextResponse.json({
        success: true,
        step1Verified: true,
        newEmailMasked: maskEmail(reqData.newEmail),
        message: `Identity verified! OTP 2 dispatched to ${maskEmail(reqData.newEmail)}`
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: STEP 2 - VERIFY NEW EMAIL OTP & SAVE TO DB
    // -------------------------------------------------------------------------
    if (action === 'verify-step2-otp') {
      const { requestId, newOtp } = body;
      const reqData = emailMemoryStore.get(requestId);

      if (!reqData || reqData.userId !== user.id || !reqData.verified || !reqData.newEmail) {
        return NextResponse.json({ error: 'Invalid verification session' }, { status: 400 });
      }

      if ((newOtp || '').trim() !== reqData.newOtp.trim()) {
        return NextResponse.json({ error: 'Incorrect OTP entered for your new email address' }, { status: 400 });
      }

      const cleanNewEmail = reqData.newEmail;

      // 1. Direct SQL Update into public.profiles
      try {
        const updateRes = await queryDb(
          `UPDATE public.profiles SET email = $1 WHERE id = $2 RETURNING id`,
          [cleanNewEmail, user.id]
        );
        if (!updateRes || updateRes.rowCount === 0) {
          const userRole = user.user_metadata?.role || 'employer';
          await queryDb(
            `INSERT INTO public.profiles (id, email, phone, role, status) VALUES ($1, $2, $3, $4, 'approved')`,
            [user.id, cleanNewEmail, user.phone || null, userRole]
          );
        }
        console.log(`[DIRECT DB UPDATE SUCCESS] Updated email to ${cleanNewEmail} in profiles table for user ${user.id}`);
      } catch (dbErr) {
        console.error("Direct SQL profiles update error:", dbErr);
      }

      // 2. Direct SQL Update into public.employer_profiles
      try {
        await queryDb(
          `UPDATE public.employer_profiles SET email = $1, updated_at = NOW() WHERE user_id = $2`,
          [cleanNewEmail, user.id]
        );
      } catch (empDbErr) {
        console.warn("Direct SQL employer_profiles update notice:", empDbErr);
      }

      // 3. Worker profiles store email on public.profiles (no action needed on worker_profiles table)

      // 4. Update auth.users via Admin API
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email: cleanNewEmail,
          email_confirm: true,
          user_metadata: { email: cleanNewEmail }
        });
      } catch (authErr) {
        console.warn("Auth admin email update warning (non-fatal):", authErr);
      }

      emailMemoryStore.delete(requestId);

      return NextResponse.json({
        success: true,
        newEmail: cleanNewEmail,
        message: 'Email address updated and saved to database successfully!'
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    console.error("Email change endpoint error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
