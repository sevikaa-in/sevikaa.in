import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

const BUCKET_MAP: Record<string, string> = {
  video_url: 'worker-videos',
  profile_picture_url: 'verification-documents',
  aadhaar_front_url: 'verification-documents',
  aadhaar_back_url: 'verification-documents',
  residency_proof_url: 'verification-documents',
};

const MIME_MAP: Record<string, string> = {
  video_url: 'video/mp4',
  profile_picture_url: 'image/jpeg',
  aadhaar_front_url: 'image/jpeg',
  aadhaar_back_url: 'image/jpeg',
  residency_proof_url: 'image/jpeg',
};

export async function POST(req: NextRequest) {
  try {
    const { userId, assetType, fileName, mimeType: clientMime } = await req.json();

    if (!userId || !assetType || !fileName) {
      return NextResponse.json({ error: 'userId, assetType, and fileName are required' }, { status: 400 });
    }

    const bucket = BUCKET_MAP[assetType];
    if (!bucket) {
      return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 });
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || (assetType === 'video_url' ? 'mp4' : 'jpg');
    const filePath = `documents/${userId}/${assetType}_${Date.now()}.${ext}`;
    const mimeType = clientMime || MIME_MAP[assetType] || 'application/octet-stream';

    // Generate a signed upload URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('[upload/sign] Failed to create signed URL:', error?.message);
      return NextResponse.json({ error: error?.message || 'Failed to create upload URL' }, { status: 500 });
    }

    // Build the public URL that will be accessible after upload
    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      bucket,
      publicUrl: publicUrlData.publicUrl,
      mimeType,
    });
  } catch (err: any) {
    console.error('[upload/sign] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
