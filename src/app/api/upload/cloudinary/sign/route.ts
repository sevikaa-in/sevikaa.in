import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import cloudinary from '@/lib/cloudinaryClient';
import { logDocumentAccess } from '@/lib/auditLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

/**
 * GET /api/upload/cloudinary/sign?ref=cloudinary:image:sevikaa/worker-documents/...
 *
 * Generates a 1-hour expiring signed URL for private Cloudinary assets (Aadhaar docs).
 * Strictly accessible ONLY to authenticated owners or administrative roles.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Requester Session
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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

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

    // 2. Authorize Access (Admin / Super Admin or owner whose ID is present in path)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';
    const isOwner = publicId.includes(user.id);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden', message: 'Access denied to document resource.' }, { status: 403 });
    }

    // Generate signed URL valid for 1 hour
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });

    // Log document access audit event for security monitoring
    logDocumentAccess(user.id, user.email || user.id, profile?.role || 'user', ref, req).catch(() => {});

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

