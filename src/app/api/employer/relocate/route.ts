import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session — derive employer identity strictly from verified bearer token (IDOR Fix)
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
        } catch {
          token = sbCookie.value;
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required for relocation request.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Authenticated user ID is canonical — never trust body.userId / body.employerId
    const activeUserId = user.id;

    const body = await req.json().catch(() => ({}));

    if (!body.targetSociety) {
      return NextResponse.json({ error: 'targetSociety is required' }, { status: 400 });
    }

    const { targetSociety, targetSocietyId, reason, residencyProofUrl, employerName, employerPhone, currentSociety } = body;

    // 2. Fetch current profile details if not passed (no runtime DDL)
    let empName = employerName || 'Employer Household';
    let empPhone = employerPhone || '';
    let curSoc = currentSociety || '';

    try {
      const empRes = await queryDb(
        `SELECT ep.company_name, ep.name, ep.society_name, p.phone 
         FROM public.employer_profiles ep 
         LEFT JOIN public.profiles p ON p.id::text = ep.user_id::text 
         WHERE ep.user_id::text = $1 OR ep.id::text = $1 LIMIT 1`,
        [activeUserId]
      );
      if (empRes?.rows?.[0]) {
        const row = empRes.rows[0];
        empName = employerName || row.company_name || row.name || 'Employer Household';
        empPhone = employerPhone || row.phone || '';
        curSoc = currentSociety || row.society_name || 'Current Society';
      }
    } catch (fetchErr) {
      console.warn('Profile fetch warning:', fetchErr);
    }

    // 3. Insert relocation request (table created in migration)
    const insertRes = await queryDb(
      `INSERT INTO public.society_relocation_requests 
         (employer_id, employer_name, employer_phone, current_society, target_society, target_society_id, reason, residency_proof_url, status)
       VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id, created_at`,
      [
        activeUserId,
        empName,
        empPhone,
        curSoc,
        targetSociety.trim(),
        targetSocietyId || null,
        reason || 'Relocating to new residential gated society',
        residencyProofUrl || null
      ]
    );

    const requestId = insertRes?.rows?.[0]?.id;

    // 4. Update public.employer_profiles status
    try {
      await queryDb(
        `UPDATE public.employer_profiles 
         SET status = 'changes_requested',
             residency_proof_url = COALESCE($1, residency_proof_url)
         WHERE user_id::text = $2 OR id::text = $2`,
        [residencyProofUrl || null, activeUserId]
      );
    } catch (upErr) {
      console.warn('employer_profiles update notice:', upErr);
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: `Relocation request to "${targetSociety.trim()}" submitted successfully for admin audit!`
    });
  } catch (err: any) {
    console.error('Relocation request submission error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit relocation request' }, { status: 500 });
  }
}
