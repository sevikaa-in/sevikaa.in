import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinaryClient';
import { queryDb } from '@/lib/db';

/**
 * POST /api/upload/cloudinary
 *
 * Security model:
 *  - Videos & photos   → type: 'upload'        (PUBLIC  — profile content, not sensitive)
 *  - Aadhaar documents → type: 'authenticated'  (PRIVATE — government ID, signed URLs only)
 *
 * File size limits:
 *  - Videos:          50 MB  (60-sec intro at 720p)
 *  - Profile photo:    5 MB  (phone camera selfie)
 *  - Aadhaar docs:    10 MB  (high-res scan / PDF)
 */

const FOLDER_MAP: Record<string, string> = {
  video_url:           'sevikaa/worker-videos',
  profile_picture_url: 'sevikaa/worker-selfies',
  aadhaar_front_url:   'sevikaa/worker-documents',
  aadhaar_back_url:    'sevikaa/worker-documents',
  residency_proof_url: 'sevikaa/employer-documents',
};

const RESOURCE_TYPE_MAP: Record<string, 'video' | 'image' | 'raw'> = {
  video_url:           'video',
  profile_picture_url: 'image',
  aadhaar_front_url:   'image',
  aadhaar_back_url:    'image',
  residency_proof_url: 'image',
};

// Size limits in bytes
const SIZE_LIMITS: Record<string, number> = {
  video_url:           50  * 1024 * 1024,  // 50 MB
  profile_picture_url:  5  * 1024 * 1024,  //  5 MB
  aadhaar_front_url:   10  * 1024 * 1024,  // 10 MB
  aadhaar_back_url:    10  * 1024 * 1024,  // 10 MB
  residency_proof_url: 10  * 1024 * 1024,  // 10 MB
};

// Allowed MIME types per asset
const ALLOWED_MIME: Record<string, string[]> = {
  video_url:           ['video/mp4', 'video/webm', 'video/quicktime'],
  profile_picture_url: ['image/jpeg', 'image/png', 'image/webp'],
  aadhaar_front_url:   ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  aadhaar_back_url:    ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  residency_proof_url: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

// Aadhaar & residency docs are stored PRIVATE — requires signed URL to view
const PRIVATE_ASSETS = new Set(['aadhaar_front_url', 'aadhaar_back_url', 'residency_proof_url']);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const assetType = formData.get('assetType') as string | null;

    if (!file || !userId || !assetType) {
      return NextResponse.json({ error: 'file, userId, and assetType are required' }, { status: 400 });
    }

    if (!FOLDER_MAP[assetType]) {
      return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 });
    }

    // Validate MIME type
    const allowedMimes = ALLOWED_MIME[assetType];
    if (file.type && !allowedMimes.includes(file.type)) {
      return NextResponse.json({
        error: `File type "${file.type}" not allowed for ${assetType}. Allowed: ${allowedMimes.join(', ')}`
      }, { status: 400 });
    }

    // Validate file size
    const maxBytes = SIZE_LIMITS[assetType];
    if (file.size > maxBytes) {
      return NextResponse.json({
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max allowed: ${maxBytes / 1024 / 1024} MB`
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = FOLDER_MAP[assetType];
    const resourceType = RESOURCE_TYPE_MAP[assetType];
    const isPrivate = PRIVATE_ASSETS.has(assetType);
    const publicId = `${folder}/${userId}_${assetType}_${Date.now()}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
          // PRIVATE for Aadhaar/sensitive docs — can only be viewed via signed URL
          type: isPrivate ? 'authenticated' : 'upload',
          // For PDFs (Aadhaar scans): use 'raw' resource_type trick via auto
          ...(file.type === 'application/pdf' && { resource_type: 'raw' as any }),
          // Video: eager-transcode to H.264 MP4 for universal browser playback
          ...(resourceType === 'video' && {
            eager: [{ format: 'mp4', video_codec: 'h264' }],
            eager_async: true,
          }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // PRIVATE assets: store opaque cloudinary reference (not a direct URL)
    // PUBLIC assets: store the direct CDN HTTPS URL
    const storedValue = isPrivate
      ? `cloudinary:${file.type === 'application/pdf' ? 'raw' : resourceType}:${uploadResult.public_id}`
      : uploadResult.secure_url;

    // Persist URL/reference to the DB
    if (assetType === 'residency_proof_url') {
      await queryDb(
        `UPDATE public.employer_profiles SET residency_proof_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
        [storedValue, userId]
      );
    } else {
      await queryDb(
        `UPDATE public.worker_profiles SET ${assetType} = $1 WHERE user_id::text = $2 OR id::text = $2`,
        [storedValue, userId]
      );
      if (assetType === 'profile_picture_url') {
        await queryDb(
          `UPDATE public.employer_profiles SET avatar_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [storedValue, userId]
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      publicUrl: storedValue,
      isPrivate,
      cloudinaryId: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    });
  } catch (err: any) {
    console.error('[upload/cloudinary] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
