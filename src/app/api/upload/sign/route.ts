import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const ALLOWED_ASSET_TYPES = new Set([
  'video_url',
  'profile_picture_url',
  'avatar_url',
  'aadhaar_front_url',
  'aadhaar_back_url',
  'residency_proof_url',
  'police_verification_url',
]);

const BUCKET_MAP: Record<string, string> = {
  video_url: 'worker-videos',
  profile_picture_url: 'verification-documents',
  avatar_url: 'verification-documents',
  aadhaar_front_url: 'verification-documents',
  aadhaar_back_url: 'verification-documents',
  residency_proof_url: 'verification-documents',
  police_verification_url: 'verification-documents',
};

const ALLOWED_EXTENSIONS: Record<string, Set<string>> = {
  video_url: new Set(['mp4', 'mov', 'webm', 'm4v']),
  profile_picture_url: new Set(['jpg', 'jpeg', 'png', 'webp']),
  avatar_url: new Set(['jpg', 'jpeg', 'png', 'webp']),
  aadhaar_front_url: new Set(['jpg', 'jpeg', 'png', 'pdf']),
  aadhaar_back_url: new Set(['jpg', 'jpeg', 'png', 'pdf']),
  residency_proof_url: new Set(['jpg', 'jpeg', 'png', 'pdf']),
  police_verification_url: new Set(['jpg', 'jpeg', 'png', 'pdf']),
};

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication token required.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, assetType, fileName, mimeType: clientMime } = body;

    if (!userId || !assetType || !fileName) {
      return NextResponse.json({ error: 'userId, assetType, and fileName are required' }, { status: 400 });
    }

    // 2. Validate assetType against allowlist (Audit 6 Fix #17)
    if (!ALLOWED_ASSET_TYPES.has(assetType)) {
      return NextResponse.json({ error: `Invalid assetType: "${assetType}".` }, { status: 400 });
    }

    // 3. Validate extension
    const sanitizeExt = fileName.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ALLOWED_EXTENSIONS[assetType] || new Set(['jpg', 'jpeg', 'png']);
    if (!allowedExts.has(sanitizeExt)) {
      return NextResponse.json({
        error: `File extension ".${sanitizeExt}" not allowed for ${assetType}. Allowed: ${[...allowedExts].join(', ')}`
      }, { status: 400 });
    }

    // 4. Validate Ownership or Admin Authorization
    if (user.id !== userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const isAuthorizedAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';
      if (!isAuthorizedAdmin) {
        return NextResponse.json({ error: 'Forbidden', message: 'Cannot generate upload URL for another user account.' }, { status: 403 });
      }
    }

    const bucket = BUCKET_MAP[assetType] || 'verification-documents';
    const filePath = `documents/${userId}/${assetType}_${Date.now()}.${sanitizeExt}`;

    // Generate a signed upload URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('[upload/sign] Failed to create signed URL:', error?.message);
      return NextResponse.json({ error: error?.message || 'Failed to create upload URL' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    console.error('[upload/sign] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate signed URL' }, { status: 500 });
  }
}
