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
    // Cascade lookup: userId → phone → email
    let profile: any = null;

    if (userId) {
      const r = await queryDb(`SELECT * FROM public.profiles WHERE id = $1 LIMIT 1`, [userId]);
      profile = r?.rows[0] || null;
    }

    if (!profile && phone) {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      if (cleanDigits.length === 10) {
        const r = await queryDb(
          `SELECT * FROM public.profiles WHERE RIGHT(REGEXP_REPLACE(COALESCE(phone,''),'[^0-9]','','g'),10) = $1 LIMIT 1`,
          [cleanDigits]
        );
        profile = r?.rows[0] || null;
      }
    }

    if (!profile && email) {
      const r = await queryDb(`SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1`, [email.toLowerCase().trim()]);
      profile = r?.rows[0] || null;
    }

    // Collect all candidate IDs to check (the auth UUID + any DB profile id found)
    const candidateIds = [...new Set([userId, profile?.id].filter(Boolean))];

    let workerProfile = null;
    let employerProfile = null;

    for (const id of candidateIds) {
      if (!workerProfile) {
        const wpRes = await queryDb(
          `SELECT * FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [id]
        );
        workerProfile = wpRes?.rows[0] || null;
      }
      if (!employerProfile) {
        const epRes = await queryDb(
          `SELECT * FROM public.employer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [id]
        );
        employerProfile = epRes?.rows[0] || null;
      }
      if (workerProfile && employerProfile) break;
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
