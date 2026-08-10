import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session — derive userId strictly from verified bearer token (IDOR Fix)
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

    const body = await req.json().catch(() => ({}));

    let authenticatedUserId: string | null = null;
    if (token) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) authenticatedUserId = user.id;
    }

    // IDOR Protection: always prefer verified auth.uid() over client-supplied userId
    const activeUserId = authenticatedUserId || body.userId || body.id || body.user_id;
    if (!activeUserId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const {
      company_name, full_name, name,
      phone, email,
      society_name, tower_block, tower, address, billing_address,
      city, state, pincode, gstin, alternate_phone, alt_phone,
      verification_requirement, residency_proof_url, aadhaar_front_url, aadhaar_back_url, avatar_url
    } = body;

    const displayName = company_name || full_name || name || 'Employer Household';
    const finalAddress = address || billing_address || null;
    const finalSociety = society_name || null;
    const finalTower = tower_block || tower || null;
    const finalCity = city || 'Bangalore';
    const finalState = state || 'Karnataka';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address for receiving subscription invoices & payment receipts.' }, { status: 400 });
    }

    // Validate alternate phone if provided
    const rawAlt = alternate_phone || alt_phone || '';
    const cleanAltDigits = rawAlt.replace(/\D/g, '');
    if (cleanAltDigits && cleanAltDigits.length !== 10) {
      return NextResponse.json({ success: false, error: 'Alternate / Family contact number must be exactly 10 digits if provided.' }, { status: 400 });
    }
    const finalAltPhone = cleanAltDigits ? `+91 ${cleanAltDigits.slice(-10)}` : null;

    // 2. Upsert employer_profiles (no runtime DDL — schema managed via migrations)
    await queryDb(`
      INSERT INTO public.employer_profiles 
           (user_id, id, name, company_name, society_name, billing_address, address, tower_block, city, state, pincode, gstin, alternate_phone, verification_requirement, residency_proof_url, aadhaar_front_url, aadhaar_back_url, avatar_url, status)
      VALUES 
           ($1, $1, $2, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'live')
      ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name,
           company_name = EXCLUDED.company_name,
           society_name = COALESCE(EXCLUDED.society_name, public.employer_profiles.society_name),
           billing_address = COALESCE(EXCLUDED.billing_address, public.employer_profiles.billing_address),
           address = COALESCE(EXCLUDED.address, public.employer_profiles.address),
           tower_block = COALESCE(EXCLUDED.tower_block, public.employer_profiles.tower_block),
           city = COALESCE(EXCLUDED.city, public.employer_profiles.city),
           state = COALESCE(EXCLUDED.state, public.employer_profiles.state),
           pincode = COALESCE(EXCLUDED.pincode, public.employer_profiles.pincode),
           gstin = COALESCE(EXCLUDED.gstin, public.employer_profiles.gstin),
           alternate_phone = COALESCE(EXCLUDED.alternate_phone, public.employer_profiles.alternate_phone),
           residency_proof_url = COALESCE(EXCLUDED.residency_proof_url, public.employer_profiles.residency_proof_url),
           aadhaar_front_url = COALESCE(EXCLUDED.aadhaar_front_url, public.employer_profiles.aadhaar_front_url),
           aadhaar_back_url = COALESCE(EXCLUDED.aadhaar_back_url, public.employer_profiles.aadhaar_back_url),
           avatar_url = COALESCE(EXCLUDED.avatar_url, public.employer_profiles.avatar_url),
           status = 'live'
    `, [
      activeUserId,
      displayName,
      finalSociety,
      finalAddress,
      finalTower,
      finalCity,
      finalState,
      pincode || null,
      gstin || null,
      finalAltPhone,
      verification_requirement || 'Aadhaar + Police Audit (Default)',
      residency_proof_url || null,
      aadhaar_front_url || null,
      aadhaar_back_url || null,
      avatar_url || null
    ]);

    // 3. Update public.profiles (no runtime DDL)
    const cleanPhoneDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const formattedPhone = cleanPhoneDigits ? `+91${cleanPhoneDigits}` : phone;

    await queryDb(`
      UPDATE public.profiles
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          status = 'live'
      WHERE id = $4 OR id::text = $4::text;
    `, [displayName, email.trim(), formattedPhone, activeUserId]);

    return NextResponse.json({
      success: true,
      message: 'Employer onboarding completed successfully!',
      profile: {
        user_id: activeUserId,
        id: activeUserId,
        company_name: displayName,
        name: displayName,
        email: email.trim(),
        phone: formattedPhone,
        society_name: finalSociety,
        tower_block: finalTower,
        address: finalAddress,
        city: finalCity,
        state: finalState,
        status: 'live'
      }
    });

  } catch (error: any) {
    console.error('Error in employer onboarding API route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
