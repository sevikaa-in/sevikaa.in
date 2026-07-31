import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role, onboarding_mode, preferred_language, language } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (role !== 'worker' && role !== 'employer') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const langCode = preferred_language || language || 'hi';
    const langNameMap: Record<string, string> = {
      hi: 'Hindi', en: 'English', kn: 'Kannada', te: 'Telugu', ta: 'Tamil',
      bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ml: 'Malayalam',
      as: 'Assamese', ne: 'Nepali'
    };
    const resolvedLangName = langNameMap[langCode] || 'Hindi';

    // 1. Fetch dynamic helpline phone
    let helplinePhone = process.env.NEXT_PUBLIC_ADMIN_HELPLINE_PHONE || '+91 7096093039';
    try {
      const settingRes = await queryDb(`SELECT value FROM public.admin_settings WHERE key = 'helpline_phone' LIMIT 1`);
      if (settingRes && settingRes.rows.length > 0 && settingRes.rows[0].value) {
        helplinePhone = settingRes.rows[0].value;
      }
    } catch (sErr) {
      console.warn("Notice: admin_settings query skipped:", sErr);
    }

    // 2. Update public.profiles role & initial status
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET role = $1, 
             status = COALESCE(status, 'pending_review') 
         WHERE id = $2`, 
        [role, userId]
      );
    } catch (pErr) {
      console.warn("Profiles update notice:", pErr);
    }

    let scheduledSlotStr = '';

    // 3. Initialize sub-profile stub if not exists
    if (role === 'employer') {
      const epCheck = await queryDb(`SELECT id FROM public.employer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [userId]);
      const initialStatus = onboarding_mode === 'assisted' ? 'pending_review' : 'active';
      if (!epCheck || epCheck.rows.length === 0) {
        try {
          await queryDb(
            `INSERT INTO public.employer_profiles (id, user_id, company_name, status) VALUES ($1, $1, $2, $3)`,
            [userId, 'Household Owner', initialStatus]
          );
        } catch (epErr) {
          console.warn("Employer profile stub insert notice:", epErr);
        }
      }
    } else {
      const wpCheck = await queryDb(`SELECT id, full_name, phone FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [userId]);
      let workerName = 'Worker Candidate';
      let workerPhone = '';

      if (!wpCheck || wpCheck.rows.length === 0) {
        try {
          await queryDb(
            `INSERT INTO public.worker_profiles (id, user_id, full_name, languages_spoken, status) VALUES ($1, $1, $2, $3, 'pending_review')`,
            [userId, 'Worker Candidate', [resolvedLangName]]
          );
        } catch (wpErr) {
          console.warn("Worker profile stub insert notice:", wpErr);
        }
      } else {
        workerName = wpCheck.rows[0].full_name || 'Worker Candidate';
        workerPhone = wpCheck.rows[0].phone || '';
        try {
          await queryDb(
            `UPDATE public.worker_profiles SET languages_spoken = COALESCE(languages_spoken, $1) WHERE user_id = $2 OR id = $2`,
            [[resolvedLangName], userId]
          );
        } catch (wpUpErr) {
          console.warn("Worker profile languages update notice:", wpUpErr);
        }
      }

      // If Assisted mode, auto-schedule 15-min IST daytime slot into interview queue
      if (onboarding_mode === 'assisted') {
        try {
          // Calculate IST slot (8 AM - 6 PM IST)
          const now = new Date();
          const countRes = await queryDb(`SELECT COUNT(*) as cnt FROM public.interviews WHERE DATE(created_at) = CURRENT_DATE`);
          const slotIndex = parseInt(countRes?.rows[0]?.cnt || '0', 10);
          
          let scheduleTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
          const offsetMinutes = (slotIndex % 32) * 15;
          scheduleTime = new Date(scheduleTime.getTime() + offsetMinutes * 60 * 1000);

          const istHours = (scheduleTime.getUTCHours() + 5 + Math.floor((scheduleTime.getUTCMinutes() + 30) / 60)) % 24;
          if (istHours < 8 || istHours >= 18) {
            scheduleTime.setUTCDate(scheduleTime.getUTCDate() + (istHours >= 18 ? 1 : 0));
            scheduleTime.setUTCHours(4, 30, 0, 0); // 10:00 AM IST
          }

          const formattedDate = scheduleTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const formattedTime = scheduleTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          scheduledSlotStr = `${formattedDate} at ${formattedTime}`;

          // Insert or update interview record
          await queryDb(
            `INSERT INTO public.interviews (
              id, worker_id, worker_name, category, scheduled_date, scheduled_time, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled')
            ON CONFLICT (id) DO UPDATE SET scheduled_date = EXCLUDED.scheduled_date, scheduled_time = EXCLUDED.scheduled_time, status = 'Scheduled'`,
            [userId, userId, workerName, 'Assisted Telephonic Verification', scheduleTime.toISOString().split('T')[0], formattedTime]
          );

          // Dispatch DLT SMS if phone exists
          if (workerPhone) {
            fetch(`${req.nextUrl.origin}/api/notifications/trigger`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'interview_scheduled',
                userId,
                name: workerName,
                phone: workerPhone,
                scheduledDate: formattedDate,
                scheduledTime: formattedTime,
                note: `Sevikaa Telephonic Onboarding. Helpline: ${helplinePhone}`
              })
            }).catch(smsErr => console.warn("Automated DLT SMS dispatch notice:", smsErr));
          }
        } catch (queueErr) {
          console.warn("Assisted onboarding queue scheduling notice:", queueErr);
        }
      }
    }

    const res = NextResponse.json({
      success: true,
      role,
      onboarding_mode: onboarding_mode || 'self',
      helplinePhone,
      scheduledSlot: scheduledSlotStr
    });
    res.cookies.set('sevikaa_user_role', role, { path: '/', maxAge: 86400, sameSite: 'lax' });
    return res;
  } catch (err: any) {
    console.error("Set role API error:", err);
    return NextResponse.json({ error: err.message || 'Server error setting role' }, { status: 500 });
  }
}
