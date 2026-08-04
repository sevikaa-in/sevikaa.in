import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, userId, company_name, society_name, tower_block, address, 
      city, state, pincode, gstin, alternate_phone, verification_requirement, status, is_approved 
    } = body;

    const targetId = id || userId;
    if (!targetId) {
      return NextResponse.json({ error: 'Employer ID is required' }, { status: 400 });
    }

    // 1. Ensure columns exist on public.employer_profiles
    try {
      await queryDb(`
        ALTER TABLE public.employer_profiles 
        ADD COLUMN IF NOT EXISTS company_name text,
        ADD COLUMN IF NOT EXISTS society_name text,
        ADD COLUMN IF NOT EXISTS tower_block text,
        ADD COLUMN IF NOT EXISTS address text,
        ADD COLUMN IF NOT EXISTS city text,
        ADD COLUMN IF NOT EXISTS state text,
        ADD COLUMN IF NOT EXISTS pincode text,
        ADD COLUMN IF NOT EXISTS gstin text,
        ADD COLUMN IF NOT EXISTS alternate_phone text,
        ADD COLUMN IF NOT EXISTS verification_requirement text,
        ADD COLUMN IF NOT EXISTS status text,
        ADD COLUMN IF NOT EXISTS is_approved boolean,
        ADD COLUMN IF NOT EXISTS avatar_url text,
        ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
        ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      `).catch(() => {});

      const checkRes = await queryDb(
        `SELECT id FROM public.employer_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
        [targetId]
      );

      if (checkRes && checkRes.rows.length > 0) {
        await queryDb(
          `UPDATE public.employer_profiles 
           SET company_name = COALESCE($1::text, company_name),
               society_name = COALESCE($2::text, society_name),
               tower_block = COALESCE($3::text, tower_block),
               address = COALESCE($4::text, address),
               city = COALESCE($5::text, city),
               state = COALESCE($6::text, state),
               pincode = COALESCE($7::text, pincode),
               gstin = COALESCE($8::text, gstin),
               alternate_phone = COALESCE($9::text, alternate_phone),
               verification_requirement = COALESCE($10::text, verification_requirement),
               status = COALESCE($11::text, status),
               is_approved = CASE WHEN $13::text IS NOT NULL THEN ($13::text = 'true') ELSE is_approved END,
               updated_at = NOW()
           WHERE id::text = $12 OR user_id::text = $12`,
          [
            company_name || null, society_name || null, tower_block || null, 
            address || null, city || null, state || null, pincode || null, 
            gstin || null, alternate_phone || null, verification_requirement || null, 
            status || null, targetId,
            is_approved !== undefined ? String(is_approved) : null
          ]
        );
      } else {
        // Still update is_approved if profile doesn't exist in employer_profiles, update profiles table directly
        console.warn('Employer profile not found in employer_profiles for id:', targetId);
      }
    } catch (eErr: any) {
      console.warn("Notice updating employer_profiles:", eErr);
    }

    // 2. Update status + is_approved in public.profiles
    try {
      await queryDb(`
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean;
      `).catch(() => {});
      await queryDb(
        `UPDATE public.profiles 
         SET status = COALESCE($1, status),
             is_approved = CASE WHEN $3::text IS NOT NULL THEN ($3::text = 'true') ELSE is_approved END,
             updated_at = NOW() 
         WHERE id::text = $2`,
        [status || null, targetId, is_approved !== undefined ? String(is_approved) : null]
      );
    } catch (pErr) {
      console.warn("Notice updating profiles:", pErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating employer lead:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
