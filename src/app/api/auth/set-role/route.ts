import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const ALLOWED_ROLES = new Set(['worker', 'employer']);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — identity derived from verified token, never from body
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      const sbCookie = Array.from(req.cookies.getAll()).find(c =>
        c.name.includes('auth-token') || c.name.includes('access-token') || c.name.endsWith('-auth-token')
      );
      if (sbCookie?.value) {
        try {
          const parsed = JSON.parse(sbCookie.value);
          token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null) || sbCookie.value;
        } catch { token = sbCookie.value; }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to set role.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // 2. Parse body — userId from body is ignored; always use auth.uid()
    const body = await req.json();
    const { role, onboarding_mode, preferred_language, language } = body;

    // userId is now always the authenticated user
    const userId = user.id;

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be worker or employer.' }, { status: 400 });
    }

    const langCode = preferred_language || language || 'hi';
    const langNameMap: Record<string, string> = {
      hi: 'Hindi', en: 'English', kn: 'Kannada', te: 'Telugu', ta: 'Tamil',
      bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ml: 'Malayalam',
      as: 'Assamese', ne: 'Nepali'
    };
    const resolvedLangName = langNameMap[langCode] || 'Hindi';

    // 3. Fetch dynamic helpline phone
    let helplinePhone = process.env.NEXT_PUBLIC_ADMIN_HELPLINE_PHONE || '+91 7096093039';
    try {
      const settingRes = await queryDb(`SELECT value FROM public.admin_settings WHERE key = 'helpline_phone' LIMIT 1`);
      if (settingRes && settingRes.rows.length > 0 && settingRes.rows[0].value) {
        helplinePhone = settingRes.rows[0].value;
      }
    } catch (sErr) {
      console.warn("Notice: admin_settings query skipped:", sErr);
    }

    // 4. Update public.profiles role & initial status for the authenticated user
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

    const scheduledSlotStr = '';

    // 5. Initialize sub-profile stub if not exists
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
      try {
        const pRes = await queryDb(`SELECT phone FROM public.profiles WHERE id = $1 LIMIT 1`, [userId]);
        const _workerPhone = pRes?.rows?.[0]?.phone || '';
      } catch (pErr) {
        console.warn("Profiles phone fetch notice:", pErr);
      }

      const wpCheck = await queryDb(`SELECT id, full_name FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [userId]);

      if (!wpCheck || wpCheck.rows.length === 0) {
        try {
          await queryDb(
            `INSERT INTO public.worker_profiles (id, user_id, full_name, languages_spoken) VALUES ($1, $1, $2, $3)`,
            [userId, 'Worker Candidate', [resolvedLangName]]
          );
        } catch (wpErr) {
          console.warn("Worker profile stub insert notice:", wpErr);
        }
      } else {
        try {
          await queryDb(
            `UPDATE public.worker_profiles SET languages_spoken = COALESCE(languages_spoken, $1) WHERE user_id = $2 OR id = $2`,
            [[resolvedLangName], userId]
          );
        } catch (wpUpErr) {
          console.warn("Worker profile languages update notice:", wpUpErr);
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
    res.cookies.set('sevikaa_user_role', role, { path: '/', maxAge: 2592000, sameSite: 'lax' });
    return res;
  } catch (err: any) {
    console.error("Set role API error:", err);
    return NextResponse.json({ error: err.message || 'Server error setting role' }, { status: 500 });
  }
}
