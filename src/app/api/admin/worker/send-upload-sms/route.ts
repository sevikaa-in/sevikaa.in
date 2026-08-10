import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { sendSMS } from '@/lib/notifications';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { userId, phone } = body;

    if (!userId && !phone) {
      return NextResponse.json({ error: 'Candidate userId or phone number is required' }, { status: 400 });
    }

    let targetPhone = (phone || '').replace(/\D/g, '').slice(-10);
    let targetUserId = userId;

    // Fetch phone/userId from DB if one is missing
    if (!targetPhone || !targetUserId) {
      try {
        const uRes = await queryDb(
          `SELECT id, phone FROM public.profiles 
           WHERE id = $1 OR RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $2 LIMIT 1`,
          [userId || null, targetPhone]
        );
        if (uRes && uRes.rows.length > 0) {
          targetUserId = uRes.rows[0].id;
          targetPhone = uRes.rows[0].phone ? uRes.rows[0].phone.replace(/\D/g, '').slice(-10) : targetPhone;
        }
      } catch (dbErr) {}
    }

    if (!targetPhone || !targetUserId) {
      return NextResponse.json({ error: 'Valid candidate mobile number or ID not found' }, { status: 400 });
    }

    const secureToken = crypto.randomBytes(32).toString('hex');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sevikaa.in';
    const uploadUrl = `${appUrl}/verify-upload?t=${secureToken}`;

    // Send SMS using DLT Template SEVKAA_DOCUMENT_UPLOAD_LINK
    try {
      await sendSMS(targetPhone, 'DOCUMENT_UPLOAD_LINK', { url: uploadUrl });
    } catch (smsErr) {
      console.warn("Document upload link SMS notice:", smsErr);
    }

    return NextResponse.json({
      success: true,
      message: `1-Click Photo Upload SMS link sent to +91 ${targetPhone}`,
      uploadUrl
    });
  } catch (err: any) {
    console.error("Send upload SMS error:", err);
    return NextResponse.json({ error: err.message || 'Server error sending SMS' }, { status: 500 });
  }
}
