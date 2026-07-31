import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const assetType = formData.get('assetType') as string | null;

    if (!file || !userId || !assetType) {
      return NextResponse.json({ error: 'File, userId, and assetType are required' }, { status: 400 });
    }

    const allowedAssets = ['profile_picture_url', 'aadhaar_front_url', 'aadhaar_back_url', 'video_url', 'residency_proof_url'];
    if (!allowedAssets.includes(assetType)) {
      return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `documents/${userId}/${assetType}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage bucket 'verification-documents' or 'worker-documents'
    let publicUrl = '';
    const { data, error } = await supabaseAdmin.storage
      .from('verification-documents')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (error) {
      // Fallback bucket
      const { data: bData, error: bError } = await supabaseAdmin.storage
        .from('worker-documents')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });
      if (bError) {
        throw new Error(bError.message || 'Failed uploading to storage');
      }
      const { data: pUrl } = supabaseAdmin.storage.from('worker-documents').getPublicUrl(filePath);
      publicUrl = pUrl.publicUrl;
    } else {
      const { data: pUrl } = supabaseAdmin.storage.from('verification-documents').getPublicUrl(filePath);
      publicUrl = pUrl.publicUrl;
    }

    // Update public.worker_profiles OR public.employer_profiles in PostgreSQL
    if (assetType === 'residency_proof_url') {
      await queryDb(
        `UPDATE public.employer_profiles 
         SET residency_proof_url = $1 
         WHERE user_id = $2 OR id = $2`,
        [publicUrl, userId]
      );
    } else {
      await queryDb(
        `UPDATE public.worker_profiles 
         SET ${assetType} = $1 
         WHERE user_id = $2 OR id = $2`,
        [publicUrl, userId]
      );
      // Mirror profile_picture_url / avatar_url to employer_profiles as fallback
      if (assetType === 'profile_picture_url') {
        await queryDb(
          `UPDATE public.employer_profiles SET avatar_url = $1 WHERE user_id = $2 OR id = $2`,
          [publicUrl, userId]
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: `${assetType} uploaded successfully by Admin`,
      publicUrl
    });
  } catch (err: any) {
    console.error("Admin upload asset error:", err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
