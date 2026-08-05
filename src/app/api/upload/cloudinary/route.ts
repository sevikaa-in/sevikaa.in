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

const getFolderForAsset = (assetType: string, role?: string | null): string => {
  const isEmployer = role === 'employer' || assetType.startsWith('employer_') || assetType === 'residency_proof_url';

  if (isEmployer) {
    switch (assetType) {
      case 'profile_picture_url':
      case 'avatar_url':
        return 'sevikaa/employers/selfies';
      case 'aadhaar_front_url':
        return 'sevikaa/employers/aadhaar-front';
      case 'aadhaar_back_url':
        return 'sevikaa/employers/aadhaar-back';
      case 'residency_proof_url':
        return 'sevikaa/employers/residency-proofs';
      default:
        return 'sevikaa/employers/verification-docs';
    }
  } else {
    switch (assetType) {
      case 'video_url':
        return 'sevikaa/workers/intro-videos';
      case 'profile_picture_url':
      case 'avatar_url':
        return 'sevikaa/workers/selfies';
      case 'aadhaar_front_url':
        return 'sevikaa/workers/aadhaar-front';
      case 'aadhaar_back_url':
        return 'sevikaa/workers/aadhaar-back';
      case 'police_verification_url':
        return 'sevikaa/workers/police-verification';
      default:
        return 'sevikaa/workers/verification-docs';
    }
  }
};

const RESOURCE_TYPE_MAP: Record<string, 'video' | 'image' | 'raw'> = {
  video_url:                'video',
  profile_picture_url:      'image',
  avatar_url:               'image',
  aadhaar_front_url:        'image',
  aadhaar_back_url:         'image',
  residency_proof_url:      'image',
  police_verification_url:  'image',
};

// Size limits in bytes
const SIZE_LIMITS: Record<string, number> = {
  video_url:                50 * 1024 * 1024,  // 50 MB
  profile_picture_url:       5 * 1024 * 1024,  //  5 MB
  avatar_url:                5 * 1024 * 1024,  //  5 MB
  aadhaar_front_url:        10 * 1024 * 1024,  // 10 MB
  aadhaar_back_url:         10 * 1024 * 1024,  // 10 MB
  residency_proof_url:      10 * 1024 * 1024,  // 10 MB
  police_verification_url:  10 * 1024 * 1024,  // 10 MB
};

// Allowed MIME types per asset
const ALLOWED_MIME: Record<string, string[]> = {
  video_url:                ['video/mp4', 'video/webm', 'video/quicktime'],
  profile_picture_url:      ['image/jpeg', 'image/png', 'image/webp'],
  avatar_url:               ['image/jpeg', 'image/png', 'image/webp'],
  aadhaar_front_url:        ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  aadhaar_back_url:         ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  residency_proof_url:      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  police_verification_url:  ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

// Aadhaar & residency docs are stored PRIVATE — requires signed URL to view
const PRIVATE_ASSETS = new Set(['aadhaar_front_url', 'aadhaar_back_url', 'residency_proof_url']);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const assetType = formData.get('assetType') as string | null;
    const role = formData.get('role') as string | null;

    if (!file || !userId || !assetType) {
      return NextResponse.json({ error: 'file, userId, and assetType are required' }, { status: 400 });
    }

    const folder = getFolderForAsset(assetType, role);
    const resourceType = RESOURCE_TYPE_MAP[assetType] || 'image';

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

    const isPrivate = PRIVATE_ASSETS.has(assetType);
    const fileName = `${userId}_${assetType}_${Date.now()}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: fileName,
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

    const storedValue = uploadResult.secure_url;

    // Persist URL/reference to the DB
    const isEmployerRole = role === 'employer' || assetType === 'residency_proof_url';
    if (isEmployerRole) {
      if (assetType === 'profile_picture_url' || assetType === 'avatar_url') {
        await queryDb(
          `UPDATE public.employer_profiles SET avatar_url = $1, profile_picture_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [storedValue, userId]
        );
      } else {
        await queryDb(
          `UPDATE public.employer_profiles SET ${assetType} = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [storedValue, userId]
        );
      }
    } else {
      await queryDb(
        `UPDATE public.worker_profiles SET ${assetType} = $1 WHERE user_id::text = $2 OR id::text = $2`,
        [storedValue, userId]
      );
      if (assetType === 'profile_picture_url' || assetType === 'avatar_url') {
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
