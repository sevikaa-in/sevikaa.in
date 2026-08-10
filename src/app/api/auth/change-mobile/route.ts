import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { queryDb } from '@/lib/db';
import { sendSMSWithTemplates } from '@/lib/smsService';
import crypto from 'crypto';

// NOTE: memoryStore is a transitional in-process cache for the multi-step mobile-change OTP flow.
// TODO: migrate to otp_verifications DB table when multi-step session is redesigned.
// The dangerous fallback in getUserFromRequest (ORDER BY created_at) has been removed above.
const memoryStore = new Map<string, {
  userId: string;
  oldPhone: string;
  newPhone: string;
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

      const { data: { user }, error } = await tempClient.auth.getUser(token);
      if (user?.id) return user;
    } catch (err) {
      // token parse failed — fall through to null
    }
  }

  // No dev fallback: authentication failure is always 401
  return null;
}

// Generate cryptographically secure 6-digit OTP
function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// Mask phone number for security display (e.g. "+91 ******3456")
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
    // ACTION: STEP 1 - REQUEST EMAIL / OLD MOBILE OTP
    // -------------------------------------------------------------------------
    if (action === 'request-step1-otp') {
      const { newPhone } = body;
      const cleanNewPhone = (newPhone || '').replace(/\D/g, '').slice(-10);

      let cleanCurrentPhone = '';
      let userEmail = '';

      try {
        const dbRes = await queryDb(
          `SELECT phone, email FROM public.profiles WHERE id = $1 LIMIT 1`,
          [user.id]
        );
        if (dbRes && dbRes.rows.length > 0) {
          cleanCurrentPhone = (dbRes.rows[0].phone || '').replace(/\D/g, '').slice(-10);
          userEmail = dbRes.rows[0].email || '';
        }
      } catch (dbErr) {
        console.warn("Direct SQL profile lookup notice:", dbErr);
      }

      if (!cleanCurrentPhone) {
        cleanCurrentPhone = (user.phone || user.user_metadata?.phone || '').replace(/\D/g, '').slice(-10);
      }
      if (!userEmail) {
        userEmail = user.email || user.user_metadata?.email || '';
      }

      if (!userEmail && !cleanCurrentPhone) {
        return NextResponse.json({ error: 'No email or mobile number found for this account' }, { status: 400 });
      }

      const oldOtp = generateOtp();
      const requestId = crypto.randomUUID();
      const expiresAtMs = Date.now() + 10 * 60 * 1000;

      let oldPhoneMaskedLabel = '';
      if (cleanCurrentPhone) {
        await sendSMSWithTemplates({
          templateKey: 'LOGIN_OTP',
          phoneNumber: cleanCurrentPhone,
          variables: { otp: oldOtp },
          userId: user.id
        });
        oldPhoneMaskedLabel = maskPhone(cleanCurrentPhone);
      } else if (userEmail) {
        const { sendEmail, getSecurityOtpEmailHtml } = require('@/lib/notifications');
        await sendEmail(
          userEmail,
          'Sevikaa Account Security Verification Code',
          getSecurityOtpEmailHtml(oldOtp, cleanNewPhone ? maskPhone(cleanNewPhone) : undefined)
        );
        const parts = userEmail.split('@');
        oldPhoneMaskedLabel = `Email (${parts[0].slice(0, 3)}***@${parts[1]})`;
      }

      memoryStore.set(requestId, {
        userId: user.id,
        oldPhone: cleanCurrentPhone || 'EMAIL_OTP',
        newPhone: '',
        oldOtp,
        newOtp: '',
        expiresAt: expiresAtMs,
        verified: false
      });

      console.log(`[SEQUENTIAL OTP 1 DISPATCHED] User: ${user.id} | Target: ${oldPhoneMaskedLabel}`);

      return NextResponse.json({
        success: true,
        requestId,
        oldPhoneMasked: oldPhoneMaskedLabel,
        message: `OTP dispatched to ${oldPhoneMaskedLabel}`
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: STEP 1 - VERIFY EMAIL / OLD MOBILE OTP & INSTANTLY AUTO-SEND NEW MOBILE OTP
    // -------------------------------------------------------------------------
    if (action === 'verify-step1-otp') {
      const { requestId, oldOtp, newPhone } = body;
      const reqData = memoryStore.get(requestId);

      if (!reqData || reqData.userId !== user.id) {
        return NextResponse.json({ error: 'Invalid or expired verification session' }, { status: 400 });
      }

      if (Date.now() > reqData.expiresAt) {
        memoryStore.delete(requestId);
        return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
      }

      if ((oldOtp || '').trim() !== reqData.oldOtp.trim()) {
        return NextResponse.json({ error: 'Incorrect OTP. Please check and try again.' }, { status: 400 });
      }

      reqData.verified = true; // Mark Step 1 verified!

      // Check if newPhone was provided or already present
      const targetNewPhone = (newPhone || reqData.newPhone || '').replace(/\D/g, '').slice(-10);
      let otp2Sent = false;
      let newPhoneMaskedLabel = '';

      if (targetNewPhone && targetNewPhone.length === 10) {
        // Check uniqueness
        const { data: existingUser } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('phone', targetNewPhone)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          return NextResponse.json({ error: 'This new mobile number is already registered with another account' }, { status: 400 });
        }

        const newOtp = generateOtp();
        reqData.newPhone = targetNewPhone;
        reqData.newOtp = newOtp;
        
        // Dispatch OTP 2 to new phone number via MSG91 SMS (SEVKAA_CHANGE_MOBILE_OTP)
        const smsRes = await sendSMSWithTemplates({
          templateKey: 'CHANGE_MOBILE_OTP',
          phoneNumber: targetNewPhone,
          variables: { otp: newOtp },
          userId: user.id
        });

        otp2Sent = smsRes.success;
        newPhoneMaskedLabel = maskPhone(targetNewPhone);
        console.log(`[INSTANT AUTO DISPATCH OTP 2] User: ${user.id} | Target: +91 ******${targetNewPhone.slice(-4)}`);
      }

      memoryStore.set(requestId, reqData);

      return NextResponse.json({
        success: true,
        step1Verified: true,
        otp2Sent,
        newPhoneMasked: newPhoneMaskedLabel,
        message: otp2Sent 
          ? `Identity verified! OTP 2 dispatched to +91 ${targetNewPhone}` 
          : 'Identity verified successfully!'
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: STEP 2 - REQUEST NEW MOBILE OTP
    // -------------------------------------------------------------------------
    if (action === 'request-step2-otp') {
      const { requestId, newPhone } = body;
      const reqData = memoryStore.get(requestId);

      if (!reqData || reqData.userId !== user.id || !reqData.verified) {
        return NextResponse.json({ error: 'Please verify your identity first' }, { status: 400 });
      }

      const cleanNewPhone = (newPhone || '').replace(/\D/g, '').slice(-10);
      if (!cleanNewPhone || cleanNewPhone.length !== 10) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
      }

      // Check if new mobile number is already in use by another user profile
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', cleanNewPhone)
        .neq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json({ error: 'This mobile number is already registered with another account' }, { status: 400 });
      }

      const newOtp = generateOtp();
      reqData.newPhone = cleanNewPhone;
      reqData.newOtp = newOtp;
      memoryStore.set(requestId, reqData);

      // Dispatch OTP 2 to new phone number via MSG91 SMS (SEVKAA_CHANGE_MOBILE_OTP)
      const smsRes = await sendSMSWithTemplates({
        templateKey: 'CHANGE_MOBILE_OTP',
        phoneNumber: cleanNewPhone,
        variables: { otp: newOtp },
        userId: user.id
      });

      console.log(`[SEQUENTIAL OTP 2 DISPATCHED] User: ${user.id} | Target: +91 ******${cleanNewPhone.slice(-4)}`);

      return NextResponse.json({
        success: true,
        newPhoneMasked: maskPhone(cleanNewPhone),
        message: `OTP dispatched to +91 ${cleanNewPhone}`
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: STEP 2 - VERIFY NEW MOBILE OTP & SAVE TO DB
    // -------------------------------------------------------------------------
    if (action === 'verify-step2-otp') {
      const { requestId, newOtp } = body;
      const reqData = memoryStore.get(requestId);

      if (!reqData || reqData.userId !== user.id || !reqData.verified || !reqData.newPhone) {
        return NextResponse.json({ error: 'Invalid verification session' }, { status: 400 });
      }

      if ((newOtp || '').trim() !== reqData.newOtp.trim()) {
        return NextResponse.json({ error: 'Incorrect OTP entered for your new mobile number' }, { status: 400 });
      }

      const cleanNewPhone = reqData.newPhone;

      // 1. Direct SQL Update into public.profiles
      try {
        const updateRes = await queryDb(
          `UPDATE public.profiles SET phone = $1 WHERE id = $2 RETURNING id`,
          [cleanNewPhone, user.id]
        );
        if (!updateRes || updateRes.rowCount === 0) {
          const userRole = user.user_metadata?.role || 'employer';
          const userEmail = user.email || 'sah.debashish@gmail.com';
          await queryDb(
            `INSERT INTO public.profiles (id, email, phone, role, status) VALUES ($1, $2, $3, $4, 'approved')`,
            [user.id, userEmail, cleanNewPhone, userRole]
          );
        }
        console.log(`[DIRECT DB UPDATE SUCCESS] Updated phone to ${cleanNewPhone} in profiles table for user ${user.id}`);
      } catch (dbErr) {
        console.error("Direct SQL profiles update error:", dbErr);
      }



      // 4. Update auth.users via Admin API
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          phone: `+91${cleanNewPhone}`,
          user_metadata: { phone: cleanNewPhone }
        });
      } catch (authErr) {
        console.warn("Auth admin phone update warning (non-fatal):", authErr);
      }

      // 5. Send Final Email Confirmation ("Your Sevikaa Phone Number Has Been Changed")
      try {
        const { sendEmail, getPhoneChangedConfirmationEmailHtml } = require('@/lib/notifications');
        const userEmail = user.email || user.user_metadata?.email;
        if (userEmail) {
          await sendEmail(
            userEmail,
            'Your Sevikaa Phone Number Has Been Changed',
            getPhoneChangedConfirmationEmailHtml(reqData.oldPhone, cleanNewPhone)
          );
        }
      } catch (confirmEmailErr) {
        console.warn("Final email confirmation error (non-fatal):", confirmEmailErr);
      }

      memoryStore.delete(requestId);

      return NextResponse.json({
        success: true,
        newPhone: cleanNewPhone,
        message: 'Mobile number updated and saved to database successfully!'
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 1: REQUEST MOBILE CHANGE (Legacy Dual OTPs)
    // -------------------------------------------------------------------------
    if (action === 'request-change') {
      const { newPhone } = body;
      const cleanNewPhone = (newPhone || '').replace(/\D/g, '').slice(-10);

      if (!cleanNewPhone || cleanNewPhone.length !== 10) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
      }

      // Fetch user's current profile & email (using maybeSingle)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('phone, email, name')
        .eq('id', user.id)
        .maybeSingle();

      const cleanCurrentPhone = (profile?.phone || user.phone || '').replace(/\D/g, '').slice(-10);
      const userEmail = profile?.email || user.email || user.user_metadata?.email || '';

      if (!userEmail && !cleanCurrentPhone) {
        return NextResponse.json({ error: 'No email or mobile number found for this user account' }, { status: 400 });
      }

      if (cleanCurrentPhone && cleanCurrentPhone === cleanNewPhone) {
        return NextResponse.json({ error: 'New mobile number must be different from current mobile number' }, { status: 400 });
      }

      // Ensure profile row exists in public.profiles table
      if (!profile) {
        await supabaseAdmin.from('profiles').upsert({
          id: user.id,
          email: userEmail,
          phone: cleanCurrentPhone ? `+91 ${cleanCurrentPhone}` : null,
          role: user.user_metadata?.role || 'employer',
          name: user.user_metadata?.name || userEmail.split('@')[0] || 'User'
        }).select();
      }

      // Check if new mobile number is already in use by another user profile
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', cleanNewPhone)
        .neq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json({ error: 'This mobile number is already registered with another account' }, { status: 400 });
      }

      // Generate two distinct 6-digit OTPs
      const oldOtp = generateOtp();
      const newOtp = generateOtp();
      const requestId = crypto.randomUUID();
      const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes TTL
      const expiresAtIso = new Date(expiresAtMs).toISOString();

      // Store in Supabase DB (or memory fallback)
      try {
        await supabaseAdmin.from('mobile_change_requests').insert({
          id: requestId,
          user_id: user.id,
          old_phone: cleanCurrentPhone || 'EMAIL_OTP',
          new_phone: cleanNewPhone,
          old_otp: oldOtp,
          new_otp: newOtp,
          expires_at: expiresAtIso,
          verified: false
        });
      } catch (dbErr) {
        console.warn("DB insert to mobile_change_requests failed, falling back to memory store:", dbErr);
      }

      // Store in memory cache as secondary backup
      memoryStore.set(requestId, {
        userId: user.id,
        oldPhone: cleanCurrentPhone || 'EMAIL_OTP',
        newPhone: cleanNewPhone,
        oldOtp,
        newOtp,
        expiresAt: expiresAtMs,
        verified: false
      });

      // Dispatch OTP 1:
      let oldPhoneMaskedLabel = '';
      if (cleanCurrentPhone) {
        await sendSMSWithTemplates({
          templateKey: 'LOGIN_OTP',
          phoneNumber: cleanCurrentPhone,
          variables: { otp: oldOtp },
          userId: user.id
        });
        oldPhoneMaskedLabel = maskPhone(cleanCurrentPhone);
      } else if (userEmail) {
        const { sendEmail } = require('@/lib/notifications');
        await sendEmail(
          userEmail,
          'Sevikaa Account Verification Code',
          `<h2>Sevikaa Mobile Linking Verification</h2><p>Your security verification code to link mobile number <strong>+91 ${cleanNewPhone}</strong> is:</p><h1 style="font-size:28px;color:#1A73E8;">${oldOtp}</h1><p>Valid for 10 minutes. Do not share this code with anyone.</p>`
        );
        const parts = userEmail.split('@');
        oldPhoneMaskedLabel = `Email (${parts[0].slice(0, 3)}***@${parts[1]})`;
      } else {
        oldPhoneMaskedLabel = 'System Auto-Verified';
      }

      // Dispatch OTP 2 to new phone number (SEVKAA_CHANGE_MOBILE_OTP - Approved DLT Template #8 via MSG91)
      const resNew = await sendSMSWithTemplates({
        templateKey: 'CHANGE_MOBILE_OTP',
        phoneNumber: cleanNewPhone,
        variables: { otp: newOtp },
        userId: user.id
      });

      console.log(`[DUAL-OTP DISPATCHED] User: ${user.id} | Target: ${oldPhoneMaskedLabel}`);

      return NextResponse.json({
        success: true,
        requestId,
        oldPhoneMasked: oldPhoneMaskedLabel,
        newPhoneMasked: maskPhone(cleanNewPhone),
        isEmailOtp: !cleanCurrentPhone && !!userEmail,
        message: cleanCurrentPhone 
          ? 'OTPs sent to current mobile and new mobile numbers' 
          : 'OTPs sent to registered email address and new mobile number'
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: VERIFY AND UPDATE (Verify Dual OTPs & Update DB)
    // -------------------------------------------------------------------------
    else if (action === 'verify-and-update') {
      const { requestId, oldOtp, newOtp } = body;

      if (!requestId || !oldOtp || !newOtp) {
        return NextResponse.json({ error: 'Missing required parameters: requestId, oldOtp, newOtp' }, { status: 400 });
      }

      let reqData: any = null;

      // 1. Check Supabase DB
      try {
        const { data: dbData } = await supabaseAdmin
          .from('mobile_change_requests')
          .select('*')
          .eq('id', requestId)
          .eq('user_id', user.id)
          .eq('verified', false)
          .maybeSingle();

        if (dbData) {
          reqData = {
            userId: dbData.user_id,
            oldPhone: dbData.old_phone,
            newPhone: dbData.new_phone,
            oldOtp: dbData.old_otp,
            newOtp: dbData.new_otp,
            expiresAt: new Date(dbData.expires_at).getTime(),
            verified: dbData.verified
          };
        }
      } catch (err) {
        // Fallback to memory
      }

      // 2. Check memory fallback if DB lookup returned nothing
      if (!reqData) {
        reqData = memoryStore.get(requestId);
      }

      if (!reqData || reqData.userId !== user.id || reqData.verified) {
        return NextResponse.json({ error: 'Invalid or expired mobile change request. Please try again.' }, { status: 400 });
      }

      if (Date.now() > reqData.expiresAt) {
        memoryStore.delete(requestId);
        return NextResponse.json({ error: 'OTPs have expired. Please request new verification OTPs.' }, { status: 400 });
      }

      // Verify OTP 1 (Current Number)
      if (oldOtp.trim() !== reqData.oldOtp.trim()) {
        return NextResponse.json({ error: 'Incorrect OTP entered for your current mobile number' }, { status: 400 });
      }

      // Verify OTP 2 (New Number)
      if (newOtp.trim() !== reqData.newOtp.trim()) {
        return NextResponse.json({ error: 'Incorrect OTP entered for your new mobile number' }, { status: 400 });
      }

      // Both OTPs are valid! Update phone number in Supabase profiles & auth
      const cleanNewPhone = reqData.newPhone;

      // Update public.profiles
      const { error: profileUpdateErr } = await supabaseAdmin
        .from('profiles')
        .update({ phone: cleanNewPhone, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileUpdateErr) {
        console.error("Profile phone update error:", profileUpdateErr);
        throw new Error('Failed to update phone number in user profile');
      }

      // Update auth.users via Admin API
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          phone: `+91${cleanNewPhone}`,
          user_metadata: { phone: cleanNewPhone }
        });
      } catch (authErr) {
        console.warn("Auth admin phone update warning (non-fatal):", authErr);
      }

      // Mark request as verified
      try {
        await supabaseAdmin
          .from('mobile_change_requests')
          .update({ verified: true })
          .eq('id', requestId);
      } catch (err) {
        // ignore
      }

      memoryStore.delete(requestId);

      return NextResponse.json({
        success: true,
        newPhone: cleanNewPhone,
        message: 'Mobile number changed successfully!'
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });

  } catch (err: any) {
    console.error("Mobile change endpoint error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
