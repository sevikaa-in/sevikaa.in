import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session — strictly require verified bearer token (IDOR Fix - P0 #2)
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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to update profile.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Authenticated user ID is canonical — never trust body.userId
    const userId = user.id;

    const body = await req.json().catch(() => ({}));

    const {
      companyName, company_name,
      societyName, society_name,
      towerBlock, tower_block,
      address, city, state, pincode, gstin,
      alternate_phone, alt_phone,
      verification_requirement, verification_pref,
      familyMembers, family_members,
      houseSize, house_size,
      avatar_url, profile_picture_url,
      residency_proof_url, aadhaar_front_url, aadhaar_back_url
    } = body;

    const resolvedCompany = companyName || company_name || 'Employer Household';
    const resolvedSociety = societyName || society_name || '';
    const resolvedTower = towerBlock || tower_block || '';
    const resolvedAvatar = avatar_url || profile_picture_url || null;
    const resolvedAltPhone = alternate_phone || alt_phone || null;
    const resolvedVerification = verification_requirement || verification_pref || null;

    // 2. Update public.profiles (base details)
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET full_name = CASE WHEN $1::text IS NOT NULL AND $1::text != '' THEN $1::text ELSE full_name END,
             society_name = CASE WHEN $2::text IS NOT NULL AND $2::text != '' THEN $2::text ELSE society_name END,
             updated_at = NOW()
         WHERE id = $3`,
        [resolvedCompany, resolvedSociety, userId]
      );
    } catch (pErr) {
      console.warn("Employer base profile update warning:", pErr);
    }

    // 3. Upsert public.employer_profiles (DO NOT allow changing subscription_status or status)
    try {
      const epCheck = await queryDb(
        `SELECT id FROM public.employer_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
        [userId]
      );

      if (epCheck?.rows?.length) {
        await queryDb(
          `UPDATE public.employer_profiles
           SET company_name = CASE WHEN $1::text IS NOT NULL AND $1::text != '' THEN $1::text ELSE company_name END,
               society_name = CASE WHEN $2::text IS NOT NULL AND $2::text != '' THEN $2::text ELSE society_name END,
               tower_block = CASE WHEN $3::text IS NOT NULL AND $3::text != '' THEN $3::text ELSE tower_block END,
               address = CASE WHEN $4::text IS NOT NULL AND $4::text != '' THEN $4::text ELSE address END,
               city = CASE WHEN $5::text IS NOT NULL AND $5::text != '' THEN $5::text ELSE city END,
               state = CASE WHEN $6::text IS NOT NULL AND $6::text != '' THEN $6::text ELSE state END,
               pincode = CASE WHEN $7::text IS NOT NULL AND $7::text != '' THEN $7::text ELSE pincode END,
               gstin = CASE WHEN $8::text IS NOT NULL AND $8::text != '' THEN $8::text ELSE gstin END,
               alternate_phone = CASE WHEN $9::text IS NOT NULL AND $9::text != '' THEN $9::text ELSE alternate_phone END,
               verification_requirement = CASE WHEN $10::text IS NOT NULL AND $10::text != '' THEN $10::text ELSE verification_requirement END,
               residency_proof_url = CASE WHEN $11::text IS NOT NULL AND $11::text != '' THEN $11::text ELSE residency_proof_url END,
               aadhaar_front_url = CASE WHEN $12::text IS NOT NULL AND $12::text != '' THEN $12::text ELSE aadhaar_front_url END,
               aadhaar_back_url = CASE WHEN $13::text IS NOT NULL AND $13::text != '' THEN $13::text ELSE aadhaar_back_url END,
               avatar_url = CASE WHEN $14::text IS NOT NULL AND $14::text != '' THEN $14::text ELSE avatar_url END,
               profile_picture_url = CASE WHEN $14::text IS NOT NULL AND $14::text != '' THEN $14::text ELSE profile_picture_url END,
               updated_at = NOW()
           WHERE user_id::text = $15 OR id::text = $15`,
          [
            resolvedCompany, resolvedSociety, resolvedTower, address || null,
            city || null, state || null, pincode || null, gstin || null,
            resolvedAltPhone, resolvedVerification, residency_proof_url || null,
            aadhaar_front_url || null, aadhaar_back_url || null, resolvedAvatar, userId
          ]
        );
      } else {
        await queryDb(
          `INSERT INTO public.employer_profiles
             (id, user_id, company_name, society_name, tower_block, address, city, state, pincode, gstin, alternate_phone, verification_requirement, residency_proof_url, aadhaar_front_url, aadhaar_back_url, avatar_url, profile_picture_url, status, subscription_status, created_at)
           VALUES
             (gen_random_uuid(), CASE WHEN $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $1::uuid ELSE gen_random_uuid() END, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15, 'active', 'free', NOW())`,
          [
            userId, resolvedCompany, resolvedSociety, resolvedTower, address || null,
            city || null, state || null, pincode || null, gstin || null,
            resolvedAltPhone, resolvedVerification, residency_proof_url || null,
            aadhaar_front_url || null, aadhaar_back_url || null, resolvedAvatar
          ]
        );
      }
    } catch (epErr) {
      console.warn("Employer profile update warning:", epErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Employer profile updated successfully.',
      userId
    });
  } catch (err: any) {
    console.error("POST /api/employer/profile/update error:", err);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
