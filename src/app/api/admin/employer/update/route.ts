import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function POST(req: NextRequest) {
  const { errorResponse, context } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

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

    // Strict 100% Completeness Validation Before Approval
    if (status === 'live' || status === 'approved' || is_approved === true || String(is_approved) === 'true') {
      try {
        const empRes = await queryDb(
          `SELECT ep.*, p.email, p.phone FROM public.employer_profiles ep LEFT JOIN public.profiles p ON ep.user_id = p.id WHERE ep.user_id::text = $1 OR ep.id::text = $1 LIMIT 1`,
          [targetId]
        );
        if (empRes?.rows?.[0]) {
          const row = empRes.rows[0];
          const hasName = !!(company_name || row.company_name || row.name)?.trim();
          const hasPhone = (row.phone || '').replace(/\D/g, '').length >= 10;
          const hasEmail = !!(row.email)?.trim();
          const hasSociety = !!(society_name || row.society_name)?.trim();
          const hasTower = !!(tower_block || row.tower_block)?.trim();
          const hasAddress = !!(address || row.address || row.billing_address)?.trim();
          const hasPhoto = !!(row.avatar_url || row.profile_photo_url);
          const hasResidency = !!(row.residency_proof_url || row.maintenance_bill_url);
          const hasAadhaarFront = !!row.aadhaar_front_url;
          const hasAadhaarBack = !!row.aadhaar_back_url;

          const isTelePassed = body.is_tele_onboarded === true || body.tele_onboarded === true || row.is_tele_onboarded === true || row.is_interview_verified === true;
          if (!isTelePassed) {
            return NextResponse.json({
              success: false,
              error: `Cannot mark employer Live: Telephonic Verification required. Employer must pass Tele-Onboarding before Live approval.`
            }, { status: 400 });
          }

          const steps = [hasName, hasPhone, hasEmail, hasSociety, hasTower, hasAddress, hasPhoto, hasResidency, hasAadhaarFront, hasAadhaarBack];
          const count = steps.filter(Boolean).length;
          if (count < 10) {
            return NextResponse.json({
              success: false,
              error: `Cannot approve employer profile: Only ${count * 10}% complete (${count} of 10 steps). All 10 profile steps must be 100% complete before Admin approval.`
            }, { status: 400 });
          }
        }
      } catch (checkErr) {
        console.warn("Backend completeness check warning:", checkErr);
      }
    }

    // employer_profiles columns managed via migrations — no runtime DDL
    try {
      const rawAlt = body.alternate_phone || body.alt_phone || body.altPhone || body.alternatePhone || '';
      const cleanAltDigits = rawAlt.replace(/\D/g, '').slice(-10);
      const finalAltPhone = cleanAltDigits.length === 10 ? `+91 ${cleanAltDigits}` : (rawAlt.trim() ? rawAlt.trim() : null);

      const isTelePassed = body.is_tele_onboarded === true || body.tele_onboarded === true;
      const isResVer = body.is_residency_verified === true || isTelePassed;
      const isFrontVer = body.is_aadhaar_front_verified === true || isTelePassed;
      const isBackVer = body.is_aadhaar_back_verified === true || isTelePassed;
      const isAadhaarVer = body.is_aadhaar_verified === true || (isFrontVer && isBackVer);

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
               alternate_phone = CASE WHEN $9::text IS NOT NULL AND $9::text != '' THEN $9::text ELSE alternate_phone END,
               alt_phone = CASE WHEN $9::text IS NOT NULL AND $9::text != '' THEN $9::text ELSE alt_phone END,
               verification_requirement = COALESCE($10::text, verification_requirement),
               status = COALESCE($11::text, status),
               is_approved = CASE WHEN $13::text IS NOT NULL THEN ($13::text = 'true') ELSE is_approved END,
               is_tele_onboarded = CASE WHEN $14::boolean THEN true ELSE is_tele_onboarded END,
               is_residency_verified = CASE WHEN $15::boolean IS NOT NULL THEN $15::boolean ELSE is_residency_verified END,
               is_aadhaar_front_verified = CASE WHEN $16::boolean IS NOT NULL THEN $16::boolean ELSE is_aadhaar_front_verified END,
               is_aadhaar_back_verified = CASE WHEN $17::boolean IS NOT NULL THEN $17::boolean ELSE is_aadhaar_back_verified END,
               is_aadhaar_verified = CASE WHEN $18::boolean IS NOT NULL THEN $18::boolean ELSE is_aadhaar_verified END,
               updated_at = NOW()
           WHERE id::text = $12 OR user_id::text = $12`,
          [
            company_name || null, society_name || null, tower_block || null, 
            address || null, city || null, state || null, pincode || null, 
            gstin || null, finalAltPhone, verification_requirement || null, 
            status || null, targetId,
            is_approved !== undefined ? String(is_approved) : null,
            isTelePassed,
            body.is_residency_verified !== undefined ? body.is_residency_verified : isResVer,
            body.is_aadhaar_front_verified !== undefined ? body.is_aadhaar_front_verified : isFrontVer,
            body.is_aadhaar_back_verified !== undefined ? body.is_aadhaar_back_verified : isBackVer,
            body.is_aadhaar_verified !== undefined ? body.is_aadhaar_verified : isAadhaarVer
          ]
        );
      } else {
        await queryDb(
          `INSERT INTO public.employer_profiles 
             (id, user_id, company_name, society_name, tower_block, address, city, state, pincode, gstin, alternate_phone, verification_requirement, status, is_approved, is_tele_onboarded, is_residency_verified, is_aadhaar_front_verified, is_aadhaar_back_verified, is_aadhaar_verified, created_at, updated_at)
           VALUES 
             (gen_random_uuid(), CASE WHEN $12 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN $12::uuid ELSE gen_random_uuid() END, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($13 = 'true'), $14, $15, $16, $17, $18, NOW(), NOW())`,
          [
            company_name || null, society_name || null, tower_block || null, 
            address || null, city || null, state || null, pincode || null, 
            gstin || null, finalAltPhone, verification_requirement || null, 
            status || null, targetId,
            is_approved !== undefined ? String(is_approved) : null,
            isTelePassed,
            body.is_residency_verified !== undefined ? body.is_residency_verified : isResVer,
            body.is_aadhaar_front_verified !== undefined ? body.is_aadhaar_front_verified : isFrontVer,
            body.is_aadhaar_back_verified !== undefined ? body.is_aadhaar_back_verified : isBackVer,
            body.is_aadhaar_verified !== undefined ? body.is_aadhaar_verified : isAadhaarVer
          ]
        );
      }
    } catch (eErr: any) {
      console.warn("Notice updating employer_profiles:", eErr);
    }

    // 2. Update status + is_approved in public.profiles (schema managed via migrations — no runtime DDL)
    try {
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

    // 3. Log Audit Action
    try {
      const company = body.company_name || body.society_name || 'Employer Account';
      const summaryText = `Employer profile '${company}' updated. Status: ${status ? status.toUpperCase() : 'Updated'}. ${is_approved ? 'Marked Approved.' : ''}`;

      const activeAdminEmail = context?.email || body.admin_email || body.admin_name || 'admin@sevikaa.in';
      const activeAdminName = body.admin_name || (activeAdminEmail.includes('@') ? activeAdminEmail.split('@')[0] : 'Admin Moderator');

      logAuditAction({
        req,
        action: status ? `Employer Profile ${status.toUpperCase()}` : 'Employer Profile Updated',
        category: 'moderation',
        severity: status === 'approved' || status === 'live' ? 'info' : 'warning',
        actor: activeAdminEmail,
        admin_email: activeAdminEmail,
        admin_name: activeAdminName,
        actorRole: context?.role === 'super-admin' ? 'Super Admin' : 'Moderator',
        target_name: company,
        target_id: targetId,
        changes_summary: summaryText,
        details: summaryText,
        raw_payload: body
      }).catch(() => {});
    } catch (auditErr) {
      console.warn("Employer update audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating employer lead:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
