import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

// Bucket config (confirmed via Supabase dashboard):
// worker-videos  → PUBLIC,  allows video/mp4, video/webm, video/quicktime, 50MB limit
// verification-documents → PRIVATE, images only
// worker-documents → PRIVATE, images only
const BUCKET_MAP: Record<string, string> = {
  video_url: 'worker-videos',
  profile_picture_url: 'verification-documents',
  aadhaar_front_url: 'verification-documents',
  aadhaar_back_url: 'verification-documents',
  residency_proof_url: 'verification-documents',
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const assetType = formData.get('assetType') as string | null;

    if (!file || !userId || !assetType) {
      return NextResponse.json({ error: 'File, userId, and assetType are required' }, { status: 400 });
    }

    const allowedAssets = Object.keys(BUCKET_MAP);
    if (!allowedAssets.includes(assetType)) {
      return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = (file.name.split('.').pop() || (assetType === 'video_url' ? 'mp4' : 'jpg')).toLowerCase();
    const filePath = `documents/${userId}/${assetType}_${Date.now()}.${ext}`;
    const targetBucket = BUCKET_MAP[assetType];
    const mimeType = file.type || (assetType === 'video_url' ? 'video/mp4' : 'image/jpeg');

    let publicUrl = '';

    const { data, error } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(filePath, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      // Fallback to worker-documents (private, but stores the data)
      console.warn(`[upload-asset] Primary bucket "${targetBucket}" failed: ${error.message} — trying worker-documents`);
      const { data: bData, error: bError } = await supabaseAdmin.storage
        .from('worker-documents')
        .upload(filePath, buffer, { contentType: mimeType, upsert: true });

      if (bError) {
        // Last resort: persist as base64 data URL in the DB column
        console.warn(`[upload-asset] All buckets failed: ${bError.message} — saving as data URL`);
        publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      } else {
        const { data: pUrl } = supabaseAdmin.storage.from('worker-documents').getPublicUrl(filePath);
        publicUrl = pUrl.publicUrl;
      }
    } else {
      const { data: pUrl } = supabaseAdmin.storage.from(targetBucket).getPublicUrl(filePath);
      publicUrl = pUrl.publicUrl;
    }

    // Persist the URL to the correct DB table
    if (assetType === 'residency_proof_url') {
      await queryDb(
        `UPDATE public.employer_profiles SET residency_proof_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
        [publicUrl, userId]
      );
    } else {
      await queryDb(
        `UPDATE public.worker_profiles SET ${assetType} = $1 WHERE user_id::text = $2 OR id::text = $2`,
        [publicUrl, userId]
      );
      if (assetType === 'profile_picture_url') {
        await queryDb(
          `UPDATE public.employer_profiles SET avatar_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [publicUrl, userId]
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, message: `${assetType} uploaded successfully`, publicUrl });
  } catch (err: any) {
    console.error('[upload-asset] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
