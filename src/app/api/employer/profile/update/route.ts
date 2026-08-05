import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, company_name, full_name, name, phone, email, billing_address, 
      address, society_name, preferredSociety, status,
      tower, tower_block, city, state, pincode, gstin,
      alt_phone, alternate_phone, verification_pref, verification_requirement,
      residency_proof_url, aadhaar_front_url, aadhaar_back_url, avatar_url, profile_picture_url
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const displayName = company_name || full_name || name || null;
    const finalAddress = address || billing_address || null;
    const finalSociety = society_name || preferredSociety || null;
    const finalTower = tower_block || tower || null;

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }
    const rawAlt = alternate_phone || alt_phone || body.altPhone || body.alternatePhone || '';
    const cleanAltDigits = rawAlt.replace(/\D/g, '').slice(-10);
    const finalAltPhone = cleanAltDigits.length === 10 ? `+91 ${cleanAltDigits}` : (rawAlt.trim() ? rawAlt.trim() : null);
    const finalVerifPref = verification_requirement || verification_pref || null;
    const finalAvatar = avatar_url || profile_picture_url || null;

    // 0. Ensure all columns exist on public.employer_profiles & public.profiles
    await queryDb(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
      ALTER TABLE public.employer_profiles ALTER COLUMN name DROP NOT NULL;
      ALTER TABLE public.employer_profiles 
      ADD COLUMN IF NOT EXISTS name text,
      ADD COLUMN IF NOT EXISTS company_name text,
      ADD COLUMN IF NOT EXISTS society_name text,
      ADD COLUMN IF NOT EXISTS tower_block text,
      ADD COLUMN IF NOT EXISTS address text,
      ADD COLUMN IF NOT EXISTS billing_address text,
      ADD COLUMN IF NOT EXISTS city text,
      ADD COLUMN IF NOT EXISTS state text,
      ADD COLUMN IF NOT EXISTS pincode text,
      ADD COLUMN IF NOT EXISTS gstin text,
      ADD COLUMN IF NOT EXISTS alternate_phone text,
      ADD COLUMN IF NOT EXISTS alt_phone text,
      ADD COLUMN IF NOT EXISTS verification_requirement text,
      ADD COLUMN IF NOT EXISTS residency_proof_url text,
      ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
      ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
      ADD COLUMN IF NOT EXISTS avatar_url text,
      ADD COLUMN IF NOT EXISTS status text;
    `).catch(() => {});

    // 1. Update public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET phone = COALESCE($1, phone),
             email = COALESCE($2, email),
             full_name = COALESCE($3, full_name),
             role = 'employer'
         WHERE id::text = $4::text`,
        [phone || null, email || null, displayName, userId]
      );
    } catch (pErr) {
      console.warn("Profiles update notice:", pErr);
    }

    // 2. Upsert into public.employer_profiles
    try {
      await queryDb(
        `INSERT INTO public.employer_profiles 
           (user_id, id, name, company_name, society_name, billing_address, address, tower_block, city, state, pincode, gstin, alternate_phone, alt_phone, verification_requirement, residency_proof_url, aadhaar_front_url, aadhaar_back_url, avatar_url, status)
         VALUES 
           ($1, $1, $2, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (user_id) DO UPDATE SET
           name = COALESCE(EXCLUDED.name, public.employer_profiles.name),
           company_name = COALESCE(EXCLUDED.company_name, public.employer_profiles.company_name),
           society_name = COALESCE(EXCLUDED.society_name, public.employer_profiles.society_name),
           billing_address = COALESCE(EXCLUDED.billing_address, public.employer_profiles.billing_address),
           address = COALESCE(EXCLUDED.address, public.employer_profiles.address),
           tower_block = COALESCE(EXCLUDED.tower_block, public.employer_profiles.tower_block),
           city = COALESCE(EXCLUDED.city, public.employer_profiles.city),
           state = COALESCE(EXCLUDED.state, public.employer_profiles.state),
           pincode = COALESCE(EXCLUDED.pincode, public.employer_profiles.pincode),
           gstin = COALESCE(EXCLUDED.gstin, public.employer_profiles.gstin),
           alternate_phone = CASE WHEN EXCLUDED.alternate_phone IS NOT NULL AND EXCLUDED.alternate_phone != '' THEN EXCLUDED.alternate_phone ELSE public.employer_profiles.alternate_phone END,
           alt_phone = CASE WHEN EXCLUDED.alternate_phone IS NOT NULL AND EXCLUDED.alternate_phone != '' THEN EXCLUDED.alternate_phone ELSE public.employer_profiles.alt_phone END,
           verification_requirement = COALESCE(EXCLUDED.verification_requirement, public.employer_profiles.verification_requirement),
           residency_proof_url = COALESCE(EXCLUDED.residency_proof_url, public.employer_profiles.residency_proof_url),
           aadhaar_front_url = COALESCE(EXCLUDED.aadhaar_front_url, public.employer_profiles.aadhaar_front_url),
           aadhaar_back_url = COALESCE(EXCLUDED.aadhaar_back_url, public.employer_profiles.aadhaar_back_url),
           avatar_url = COALESCE(EXCLUDED.avatar_url, public.employer_profiles.avatar_url),
           status = COALESCE(EXCLUDED.status, public.employer_profiles.status)`,
        [
          userId,
          displayName,
          finalSociety,
          finalAddress,
          finalTower,
          city || null,
          state || null,
          pincode || null,
          gstin || null,
          finalAltPhone,
          finalVerifPref,
          residency_proof_url || null,
          aadhaar_front_url || null,
          aadhaar_back_url || null,
          finalAvatar,
          status || null
        ]
      );
    } catch (epErr) {
      console.warn("Direct DB employer_profiles insert notice:", epErr);
      try {
        await queryDb(
          `UPDATE public.employer_profiles 
           SET name = COALESCE($1, name),
               company_name = COALESCE($1, company_name), 
               society_name = COALESCE($2, society_name), 
               billing_address = COALESCE($3, billing_address),
               address = COALESCE($3, address),
               tower_block = COALESCE($4, tower_block),
               city = COALESCE($5, city),
               state = COALESCE($6, state),
               pincode = COALESCE($7, pincode),
               gstin = COALESCE($8, gstin),
               alternate_phone = CASE WHEN $9::text IS NOT NULL AND $9::text != '' THEN $9::text ELSE alternate_phone END,
               alt_phone = CASE WHEN $9::text IS NOT NULL AND $9::text != '' THEN $9::text ELSE alt_phone END,
               verification_requirement = COALESCE($10, verification_requirement),
               residency_proof_url = COALESCE($11, residency_proof_url),
               aadhaar_front_url = COALESCE($12, aadhaar_front_url),
               aadhaar_back_url = COALESCE($13, aadhaar_back_url),
               avatar_url = COALESCE($14, avatar_url)
           WHERE user_id::text = $15::text OR id::text = $15::text`,
          [
            displayName, finalSociety, finalAddress, finalTower, 
            city || null, state || null, pincode || null, gstin || null, 
            finalAltPhone, finalVerifPref, residency_proof_url || null, 
            aadhaar_front_url || null, aadhaar_back_url || null, finalAvatar, userId
          ]
        );
      } catch (epUpErr) {
        console.warn("Direct DB employer_profiles update notice:", epUpErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Employer profile updated successfully' });
  } catch (err: any) {
    console.error("Employer profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
