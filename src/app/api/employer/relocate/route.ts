import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, employerId, employerName, employerPhone, 
      currentSociety, targetSociety, targetSocietyId, reason, residencyProofUrl 
    } = body;

    const activeUserId = userId || employerId;

    if (!activeUserId || !targetSociety) {
      return NextResponse.json({ error: 'userId and targetSociety are required' }, { status: 400 });
    }

    // 1. Ensure public.society_relocation_requests table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.society_relocation_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employer_id TEXT NOT NULL,
        employer_name TEXT,
        employer_phone TEXT,
        current_society TEXT,
        target_society TEXT NOT NULL,
        target_society_id TEXT,
        reason TEXT,
        residency_proof_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE public.society_relocation_requests ADD COLUMN IF NOT EXISTS target_society_id text;
    `).catch(() => {});

    // 2. Fetch current profile details if not passed
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

    // 3. Insert relocation request record
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

    // 4. Update public.employer_profiles status and admin_note
    const noteMsg = `⏳ Society Relocation Request to "${targetSociety.trim()}" submitted for admin verification. Reason: ${reason || 'Moved to new gated community'}`;
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
