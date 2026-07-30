import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { queryDb } from '@/lib/db';
import { sendSMSWithTemplates } from '@/lib/smsService';
import crypto from 'crypto';

// In-memory store for Login OTPs
const otpStore = new Map<string, {
  otp: string;
  expiresAt: number;
}>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, email, otp, role } = body;

    // -------------------------------------------------------------------------
    // ACTION: SEND OTP VIA MSG91 (or Email)
    // -------------------------------------------------------------------------
    if (action === 'send') {
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);

      if (phone && cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Please provide a valid 10-digit mobile number' }, { status: 400 });
      }

      const generatedOtp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      if (cleanPhone) {
        // Dispatch SMS via MSG91 DLT template LOGIN_OTP using Sevikaa's smsService
        const smsResult = await sendSMSWithTemplates({
          templateKey: 'LOGIN_OTP',
          phoneNumber: cleanPhone,
          variables: { otp: generatedOtp }
        });

        otpStore.set(`phone:${cleanPhone}`, {
          otp: generatedOtp,
          expiresAt
        });

        return NextResponse.json({
          success: true,
          method: 'sms',
          message: `OTP sent via MSG91 SMS to +91 ******${cleanPhone.slice(-4)}`
        });
      }

      if (email) {
        const { sendEmail, getMagicLinkOrLoginOtpEmailHtml } = require('@/lib/emailTemplates');
        const { sendEmail: dispatchEmail } = require('@/lib/notifications');

        await dispatchEmail(
          email,
          'Your Sevikaa Verification Code',
          getMagicLinkOrLoginOtpEmailHtml(generatedOtp, false)
        );

        otpStore.set(`email:${email.toLowerCase().trim()}`, {
          otp: generatedOtp,
          expiresAt
        });

        return NextResponse.json({
          success: true,
          method: 'email',
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
      const storedData = otpStore.get(targetKey);

      if (!storedData) {
        return NextResponse.json({ error: 'No active OTP request found. Please request a new code.' }, { status: 400 });
      }

      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(targetKey);
        return NextResponse.json({ error: 'OTP code has expired. Please request a new code.' }, { status: 400 });
      }

      if ((otp || '').trim() !== storedData.otp.trim()) {
        return NextResponse.json({ error: 'Incorrect verification code. Please check and try again.' }, { status: 400 });
      }

      // OTP Verified successfully! Clear store entry
      otpStore.delete(targetKey);

      // Fetch or Create user profile in Supabase
      let userObj: { id: string; phone?: string; email?: string; role?: string } | null = null;
      let isExistingUser = false;
      const formattedPhone = cleanPhone ? `+91${cleanPhone}` : undefined;

      try {
        const cleanDigits = cleanPhone.slice(-10);
        const searchEmail = (email || '').toLowerCase().trim();

        // 1. Query public.profiles
        const dbRes = await queryDb(
          `SELECT id, email, phone, role FROM public.profiles 
           WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\\D', 'g'), 10) = $1)
              OR ($2 <> '' AND LOWER(COALESCE(email, '')) = $2)
           LIMIT 1`,
          [cleanDigits, searchEmail]
        );

        if (dbRes && dbRes.rows.length > 0) {
          const prof = dbRes.rows[0];
          isExistingUser = true;
          userObj = {
            id: prof.id,
            email: prof.email || email,
            phone: prof.phone || formattedPhone,
            role: prof.role || 'worker'
          };
        }

        // 2. If not found in profiles, check worker_profiles joined with profiles
        if (!userObj) {
          const wpRes = await queryDb(
            `SELECT p.id, p.phone, p.email, p.role FROM public.worker_profiles wp
             JOIN public.profiles p ON p.id = wp.user_id OR p.id = wp.id
             WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(p.phone, ''), '\\D', 'g'), 10) = $1)
                OR ($2 <> '' AND LOWER(COALESCE(p.email, '')) = $2)
             LIMIT 1`,
            [cleanDigits, searchEmail]
          );

          if (wpRes && wpRes.rows.length > 0) {
            const wp = wpRes.rows[0];
            isExistingUser = true;
            userObj = {
              id: wp.id,
              email: wp.email || email,
              phone: wp.phone || formattedPhone,
              role: wp.role || 'worker'
            };
          }
        }

        // 3. If not found, check employer_profiles joined with profiles
        if (!userObj) {
          const epRes = await queryDb(
            `SELECT p.id, p.phone, p.email, p.role FROM public.employer_profiles ep
             JOIN public.profiles p ON p.id = ep.user_id OR p.id = ep.id
             WHERE ($1 <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(p.phone, ''), '\\D', 'g'), 10) = $1)
                OR ($2 <> '' AND LOWER(COALESCE(p.email, '')) = $2)
             LIMIT 1`,
            [cleanDigits, searchEmail]
          );

          if (epRes && epRes.rows.length > 0) {
            const ep = epRes.rows[0];
            isExistingUser = true;
            userObj = {
              id: ep.id,
              email: ep.email || email,
              phone: ep.phone || formattedPhone,
              role: ep.role || 'employer'
            };
          }
        }
      } catch (dbErr) {
        console.warn("DB user profile lookup warning:", dbErr);
      }

      if (!userObj) {
        // Create new user profile if not found
        const newUserId = crypto.randomUUID();
        const userRole = role || 'worker';
        userObj = {
          id: newUserId,
          phone: formattedPhone,
          email: email || undefined,
          role: userRole
        };

        try {
          await queryDb(
            `INSERT INTO public.profiles (id, phone, email, role, full_name, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone`,
            [newUserId, formattedPhone || null, email || null, userRole, cleanPhone ? `User ${cleanPhone.slice(-4)}` : 'User']
          );
        } catch (insertErr) {
          console.warn("Profile creation fallback notice:", insertErr);
        }
      }

      return NextResponse.json({
        success: true,
        user: userObj,
        isExistingUser
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    console.error("Login OTP API route error:", err);
    return NextResponse.json({ error: err.message || 'Server error processing request' }, { status: 500 });
  }
}
