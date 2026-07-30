import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  if (!userId && !email && !phone) {
    return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
  }

  try {
    let profRes;
    if (userId) {
      profRes = await queryDb(`SELECT * FROM public.profiles WHERE id = $1 LIMIT 1`, [userId]);
    } else if (email) {
      profRes = await queryDb(`SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1`, [email.toLowerCase().trim()]);
    } else if (phone) {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      profRes = await queryDb(`SELECT * FROM public.profiles WHERE RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\\D', 'g'), 10) = $1 LIMIT 1`, [cleanDigits]);
    }

    const profile = profRes?.rows[0] || null;
    const targetUserId = profile?.id || userId;

    let workerProfile = null;
    let employerProfile = null;

    if (targetUserId) {
      const wpRes = await queryDb(`SELECT * FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [targetUserId]);
      workerProfile = wpRes?.rows[0] || null;

      const epRes = await queryDb(`SELECT * FROM public.employer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [targetUserId]);
      employerProfile = epRes?.rows[0] || null;
    }

    return NextResponse.json({
      success: true,
      profile,
      workerProfile,
      employerProfile
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
