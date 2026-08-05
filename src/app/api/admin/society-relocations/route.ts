import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Ensure table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.society_relocation_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employer_id TEXT NOT NULL,
        employer_name TEXT,
        employer_phone TEXT,
        current_society TEXT,
        target_society TEXT NOT NULL,
        reason TEXT,
        residency_proof_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `).catch(() => {});

    // 2. Fetch requests from society_relocation_requests
    const relRes = await queryDb(
      `SELECT r.id, r.employer_id, r.employer_name, r.employer_phone, 
              r.current_society, r.target_society, r.target_society_id, r.reason, 
              COALESCE(r.residency_proof_url, ep.residency_proof_url) AS residency_proof_url, 
              r.status, r.created_at
       FROM public.society_relocation_requests r
       LEFT JOIN public.employer_profiles ep ON ep.user_id::text = r.employer_id::text OR ep.id::text = r.employer_id::text
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );

    let requests = relRes?.rows || [];

    // 3. Fallback: check employer_profiles for any profile with status = 'changes_requested' not in relocation table
    try {
      const empRes = await queryDb(
        `SELECT ep.user_id AS employer_id, 
                COALESCE(ep.company_name, ep.name, p.email, 'Employer Household') AS employer_name,
                p.phone AS employer_phone,
                ep.society_name AS current_society,
                'Requested New Society' AS target_society,
                'Society Relocation Request' AS reason,
                ep.residency_proof_url,
                'pending' AS status,
                ep.updated_at AS created_at
         FROM public.employer_profiles ep
         LEFT JOIN public.profiles p ON p.id::text = ep.user_id::text
         WHERE ep.status = 'changes_requested'`
      );
      if (empRes?.rows && empRes.rows.length > 0) {
        const existingEmpIds = new Set(requests.map((r: any) => String(r.employer_id)));
        empRes.rows.forEach((row: any) => {
          if (!existingEmpIds.has(String(row.employer_id))) {
            requests.push({
              id: `emp_reloc_${row.employer_id}`,
              ...row
            });
          }
        });
      }
    } catch (fErr) {
      console.warn('Fallback relocation fetch notice:', fErr);
    }

    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    console.error('Fetch relocation requests error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, employerId, targetSociety, action, adminNote } = body;

    if (!action || (!requestId && !employerId)) {
      return NextResponse.json({ error: 'action and requestId or employerId are required' }, { status: 400 });
    }

    // 1. Identify request and target details
    let activeEmpId = employerId;
    let newSoc = targetSociety;

    if (requestId && !requestId.startsWith('emp_reloc_')) {
      try {
        const reqRow = await queryDb(
          `SELECT employer_id, target_society FROM public.society_relocation_requests WHERE id::text = $1 LIMIT 1`,
          [requestId]
        );
        if (reqRow?.rows?.[0]) {
          activeEmpId = activeEmpId || reqRow.rows[0].employer_id;
          newSoc = newSoc || reqRow.rows[0].target_society;
        }
      } catch (e) {}
    }

    if (requestId && requestId.startsWith('emp_reloc_')) {
      activeEmpId = activeEmpId || requestId.replace('emp_reloc_', '');
    }

    if (action === 'approve') {
      // Mark relocation request as approved
      if (requestId && !requestId.startsWith('emp_reloc_')) {
        await queryDb(
          `UPDATE public.society_relocation_requests 
           SET status = 'approved', updated_at = NOW() 
           WHERE id::text = $1`,
          [requestId]
        ).catch(() => {});
      }

      // Update employer profile with new target society location ONLY (Preserves existing profile status)
      if (activeEmpId) {
        await queryDb(
          `UPDATE public.employer_profiles 
           SET society_name = COALESCE($1, society_name),
               billing_address = COALESCE($1, billing_address),
               updated_at = NOW()
           WHERE user_id::text = $2 OR id::text = $2`,
          [newSoc || null, activeEmpId]
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: `Society relocation approved! Employer updated to "${newSoc || 'New Society'}"` 
      });
    }

    if (action === 'reject') {
      if (requestId && !requestId.startsWith('emp_reloc_')) {
        await queryDb(
          `UPDATE public.society_relocation_requests 
           SET status = 'rejected', updated_at = NOW() 
           WHERE id::text = $1`,
          [requestId]
        ).catch(() => {});
      }

      if (activeEmpId) {
        await queryDb(
          `UPDATE public.employer_profiles 
           SET updated_at = NOW()
           WHERE user_id::text = $1 OR id::text = $1`,
          [activeEmpId]
        );
      }

      return NextResponse.json({ success: true, message: 'Society relocation request rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Process relocation request error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
