import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinaryClient';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

/**
 * POST /api/upload/cloudinary
 *
 * Security model:
 *  - Requires authenticated Supabase bearer token.
 *  - Uploaders can only write to their own userId folder.
 *  - Admins/super-admins can upload on behalf of any userId.
 *  - Videos & photos   → type: 'upload'        (PUBLIC  — profile content, not sensitive)
 *  - Aadhaar documents → type: 'authenticated'  (PRIVATE — government ID, signed URLs only)
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

// Magic-byte signatures for content validation (defense against MIME spoofing)
const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg':       [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png':        [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp':       [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF
  'application/pdf':  [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  'video/mp4':        [Buffer.from([0x66, 0x74, 0x79, 0x70])], // ftyp box (at offset 4)
};

function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const signatures = MAGIC_BYTES[declaredMime];
  if (!signatures) return true; // Unknown type — pass through, Cloudinary will reject if invalid

  if (declaredMime === 'video/mp4') {
    // MP4 ftyp box starts at byte 4
    return buffer.length > 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  }

  return signatures.some(sig => buffer.subarray(0, sig.length).equals(sig));
}

// Aadhaar & residency docs are stored PRIVATE — requires signed URL to view
const PRIVATE_ASSETS = new Set(['aadhaar_front_url', 'aadhaar_back_url', 'residency_proof_url']);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session — IDOR fix: derive owner identity from verified token
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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to upload documents.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedUserId = formData.get('userId') as string | null;
    const assetType = formData.get('assetType') as string | null;
    const role = formData.get('role') as string | null;

    if (!file || !assetType) {
      return NextResponse.json({ error: 'file and assetType are required' }, { status: 400 });
    }

    // 3. Ownership authorization — check caller's profile role
    const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const isAdmin = callerProfile?.role === 'admin' || callerProfile?.role === 'super-admin';

    // Admins may upload on behalf of any user; others can only upload to themselves
    const targetUserId = isAdmin && requestedUserId ? requestedUserId : user.id;
    if (!isAdmin && requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden', message: 'You can only upload documents for your own account.' }, { status: 403 });
    }

    const folder = getFolderForAsset(assetType, role);
    const resourceType = RESOURCE_TYPE_MAP[assetType] || 'image';

    // 4. Validate MIME type (client-declared)
    const allowedMimes = ALLOWED_MIME[assetType] || [];
    if (file.type && allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
      return NextResponse.json({
        error: `File type "${file.type}" not allowed for ${assetType}. Allowed: ${allowedMimes.join(', ')}`
      }, { status: 400 });
    }

    // 5. Validate file size
    const maxBytes = SIZE_LIMITS[assetType] || 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max allowed: ${maxBytes / 1024 / 1024} MB`
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Magic-byte content validation (defense against MIME type spoofing)
    if (file.type && !validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({
        error: 'File content does not match the declared file type. Please upload a valid document.'
      }, { status: 400 });
    }

    const isPrivate = PRIVATE_ASSETS.has(assetType);
    const fileName = `${targetUserId}_${assetType}_${Date.now()}`;

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

    // 7. Persist URL/reference to the DB
    const isEmployerRole = role === 'employer' || assetType === 'residency_proof_url';
    if (isEmployerRole) {
      if (assetType === 'profile_picture_url' || assetType === 'avatar_url') {
        await queryDb(
          `UPDATE public.employer_profiles SET avatar_url = $1, profile_picture_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [storedValue, targetUserId]
        );
      } else {
        await queryDb(
          `UPDATE public.employer_profiles SET ${assetType} = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [storedValue, targetUserId]
        );
      }
    } else {
      await queryDb(
        `UPDATE public.worker_profiles SET ${assetType} = $1 WHERE user_id::text = $2 OR id::text = $2`,
        [storedValue, targetUserId]
      );
      if (assetType === 'profile_picture_url' || assetType === 'avatar_url') {
        await queryDb(
          `UPDATE public.employer_profiles SET avatar_url = $1 WHERE user_id::text = $2 OR id::text = $2`,
          [storedValue, targetUserId]
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
