import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, company_name, full_name, name, phone, email, billing_address, address, society_name, preferredSociety, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const displayName = company_name || full_name || name || 'Employer Household';
    const finalAddress = address || billing_address || null;
    const finalSociety = society_name || preferredSociety || null;

    // 1. Update public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET phone = COALESCE($1, phone),
             email = COALESCE($2, email),
             role = 'employer',
             status = 'live'
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
           (user_id, id, company_name, society_name, billing_address, address, status)
         VALUES 
           ($1, $1, $2, $3, $4, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           company_name = EXCLUDED.company_name,
           society_name = COALESCE(EXCLUDED.society_name, public.employer_profiles.society_name),
           billing_address = COALESCE(EXCLUDED.billing_address, public.employer_profiles.billing_address),
           address = COALESCE(EXCLUDED.address, public.employer_profiles.address),
           status = COALESCE(EXCLUDED.status, public.employer_profiles.status)`,
        [
          userId,
          displayName,
          finalSociety,
          finalAddress,
          status || 'active'
        ]
      );
    } catch (epErr) {
      console.warn("Direct DB employer_profiles insert notice:", epErr);
      try {
        await queryDb(
          `UPDATE public.employer_profiles 
           SET company_name = $1, society_name = $2, billing_address = $3 
           WHERE user_id = $4 OR id = $4`,
          [displayName, finalSociety, finalAddress, userId]
        );
      } catch (epUpErr) {
        console.warn("Direct DB employer_profiles update notice:", epUpErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Employer profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
