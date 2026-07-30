import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, company_name, full_name, name, phone, email, society_name, billing_address, address, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const displayName = company_name || full_name || name || 'Employer';
    const finalAddress = address || billing_address || society_name || null;

    // 1. Update public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET phone = COALESCE($1, phone),
             email = COALESCE($2, email)
         WHERE id = $3`,
        [phone || null, email || null, userId]
      );
    } catch (pErr) {
      console.warn("Profiles update notice:", pErr);
    }

    // 2. Upsert into public.employer_profiles
    try {
      await queryDb(
        `INSERT INTO public.employer_profiles 
           (user_id, id, company_name, phone, email, society_name, billing_address, status)
         VALUES 
           ($1, $1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           company_name = EXCLUDED.company_name,
           phone = COALESCE(EXCLUDED.phone, public.employer_profiles.phone),
           email = COALESCE(EXCLUDED.email, public.employer_profiles.email),
           society_name = COALESCE(EXCLUDED.society_name, public.employer_profiles.society_name),
           billing_address = COALESCE(EXCLUDED.billing_address, public.employer_profiles.billing_address),
           status = COALESCE(EXCLUDED.status, public.employer_profiles.status)`,
        [
          userId,
          displayName,
          phone || null,
          email || null,
          society_name || null,
          finalAddress,
          status || 'active'
        ]
      );
    } catch (epErr) {
      await queryDb(
        `UPDATE public.employer_profiles 
         SET company_name = $1, phone = $2, email = $3, billing_address = $4 
         WHERE user_id = $5 OR id = $5`,
        [displayName, phone || null, email || null, finalAddress, userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Employer profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
