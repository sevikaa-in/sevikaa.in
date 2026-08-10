import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import cloudinary from '@/lib/cloudinaryClient';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function POST(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    let migratedCount = 0;
    const errors: string[] = [];

    // 1. Fetch worker_profiles with Supabase media URLs
    const workersRes = await queryDb(`
      SELECT id, user_id, profile_picture_url, avatar_url, aadhaar_front_url, aadhaar_back_url, video_url
      FROM public.worker_profiles
      WHERE profile_picture_url LIKE '%supabase%'
         OR avatar_url LIKE '%supabase%'
         OR aadhaar_front_url LIKE '%supabase%'
         OR aadhaar_back_url LIKE '%supabase%'
         OR video_url LIKE '%supabase%'
    `);

    // 2. Fetch employer_profiles with Supabase media URLs
    const employersRes = await queryDb(`
      SELECT id, user_id, avatar_url, profile_picture_url, aadhaar_front_url, aadhaar_back_url, residency_proof_url
      FROM public.employer_profiles
      WHERE avatar_url LIKE '%supabase%'
         OR profile_picture_url LIKE '%supabase%'
         OR aadhaar_front_url LIKE '%supabase%'
         OR aadhaar_back_url LIKE '%supabase%'
         OR residency_proof_url LIKE '%supabase%'
    `);

    const uploadToCloudinary = async (url: string, folder: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
      try {
        const uploadResult = await cloudinary.uploader.upload(url, {
          folder,
          resource_type: resourceType,
          overwrite: true
        });
        return uploadResult.secure_url;
      } catch (err: any) {
        console.warn(`[Migrate] Cloudinary upload failed for ${url}:`, err.message);
        return null;
      }
    };

    // Process Worker Profiles
    if (workersRes?.rows) {
      for (const w of workersRes.rows) {
        const uid = w.user_id || w.id;
        const updates: Record<string, string> = {};

        if (w.profile_picture_url && w.profile_picture_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(w.profile_picture_url, 'sevikaa/workers/selfies', 'image');
          if (cUrl) { updates.profile_picture_url = cUrl; updates.avatar_url = cUrl; }
        }
        if (w.aadhaar_front_url && w.aadhaar_front_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(w.aadhaar_front_url, 'sevikaa/workers/aadhaar-front', 'image');
          if (cUrl) updates.aadhaar_front_url = cUrl;
        }
        if (w.aadhaar_back_url && w.aadhaar_back_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(w.aadhaar_back_url, 'sevikaa/workers/aadhaar-back', 'image');
          if (cUrl) updates.aadhaar_back_url = cUrl;
        }
        if (w.video_url && w.video_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(w.video_url, 'sevikaa/workers/intro-videos', 'video');
          if (cUrl) updates.video_url = cUrl;
        }

        for (const [col, cUrl] of Object.entries(updates)) {
          await queryDb(`UPDATE public.worker_profiles SET ${col} = $1 WHERE id::text = $2 OR user_id::text = $2`, [cUrl, uid]);
          migratedCount++;
        }
      }
    }

    // Process Employer Profiles
    if (employersRes?.rows) {
      for (const e of employersRes.rows) {
        const uid = e.user_id || e.id;
        const updates: Record<string, string> = {};

        if (e.avatar_url && e.avatar_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(e.avatar_url, 'sevikaa/employers/selfies', 'image');
          if (cUrl) { updates.avatar_url = cUrl; updates.profile_picture_url = cUrl; }
        }
        if (e.aadhaar_front_url && e.aadhaar_front_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(e.aadhaar_front_url, 'sevikaa/employers/aadhaar-front', 'image');
          if (cUrl) updates.aadhaar_front_url = cUrl;
        }
        if (e.aadhaar_back_url && e.aadhaar_back_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(e.aadhaar_back_url, 'sevikaa/employers/aadhaar-back', 'image');
          if (cUrl) updates.aadhaar_back_url = cUrl;
        }
        if (e.residency_proof_url && e.residency_proof_url.includes('supabase')) {
          const cUrl = await uploadToCloudinary(e.residency_proof_url, 'sevikaa/employers/residency-proofs', 'image');
          if (cUrl) updates.residency_proof_url = cUrl;
        }

        for (const [col, cUrl] of Object.entries(updates)) {
          await queryDb(`UPDATE public.employer_profiles SET ${col} = $1 WHERE id::text = $2 OR user_id::text = $2`, [cUrl, uid]);
          migratedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} media fields to Cloudinary CDN!`,
      migratedCount,
      errors
    });
  } catch (err: any) {
    console.error('[Migrate to Cloudinary] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
