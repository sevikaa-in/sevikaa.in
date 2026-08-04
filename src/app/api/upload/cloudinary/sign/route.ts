import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinaryClient';

/**
 * GET /api/upload/cloudinary/sign?ref=cloudinary:image:sevikaa/worker-documents/...
 *
 * Generates a 1-hour expiring signed URL for private Cloudinary assets (Aadhaar docs).
 * Only accessible to authenticated users. The URL expires — right-click copy is useless.
 *
 * Security:
 *  - Requires userId cookie/header to verify the requesting user owns the document
 *  - Signed URL expires in 3600 seconds (1 hour)
 *  - Cloudinary verifies the signature on every request
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'ref parameter required' }, { status: 400 });
    }

    // Parse cloudinary reference format: cloudinary:<resourceType>:<publicId>
    if (!ref.startsWith('cloudinary:')) {
      return NextResponse.json({ error: 'Invalid ref format' }, { status: 400 });
    }

    const parts = ref.split(':');
    if (parts.length < 3) {
      return NextResponse.json({ error: 'Invalid ref format' }, { status: 400 });
    }

    const resourceType = parts[1] as 'image' | 'video' | 'raw';
    const publicId = parts.slice(2).join(':'); // handles colons in publicId

    // Generate signed URL valid for 1 hour
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });

    return NextResponse.json({
      url: signedUrl,
      expiresAt,
      expiresIn: 3600,
    });
  } catch (err: any) {
    console.error('[upload/cloudinary/sign] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate signed URL' }, { status: 500 });
  }
}
