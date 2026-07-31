import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, userId, company_name, society_name, tower_block, address, 
      city, state, pincode, gstin, alternate_phone, verification_requirement, status 
    } = body;

    const targetId = id || userId;
    if (!targetId) {
      return NextResponse.json({ error: 'Employer ID is required' }, { status: 400 });
    }

    // 1. Update public.employer_profiles
    try {
      await queryDb(
        `UPDATE public.employer_profiles 
         SET company_name = COALESCE($1, company_name),
             society_name = COALESCE($2, society_name),
             tower_block = COALESCE($3, tower_block),
             address = COALESCE($4, address),
             city = COALESCE($5, city),
             state = COALESCE($6, state),
             pincode = COALESCE($7, pincode),
             gstin = COALESCE($8, gstin),
             alternate_phone = COALESCE($9, alternate_phone),
             verification_requirement = COALESCE($10, verification_requirement),
             status = COALESCE($11, status),
             updated_at = NOW()
         WHERE id = $12 OR user_id = $12`,
        [
          company_name || null, society_name || null, tower_block || null, 
          address || null, city || null, state || null, pincode || null, 
          gstin || null, alternate_phone || null, verification_requirement || null, 
          status || null, targetId
        ]
      );
    } catch (eErr: any) {
      console.warn("Notice updating employer_profiles:", eErr);
    }

    // 2. Update status in public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET status = COALESCE($1, status), updated_at = NOW() 
         WHERE id = $2`,
        [status || 'live', targetId]
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
