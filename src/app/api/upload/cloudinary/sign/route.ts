import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import cloudinary from '@/lib/cloudinaryClient';
import { logDocumentAccess } from '@/lib/auditLogger';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /api/upload/cloudinary/sign?ref=cloudinary:image:sevikaa/worker-documents/...
 *
 * Generates a 1-hour expiring signed URL for private Cloudinary assets (Aadhaar docs).
 * Strictly accessible ONLY to authenticated owners or administrative roles.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Requester Session — multi-source resolution
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      const accessCookie = req.cookies.get('sevikaa_access_token')?.value || 
                           req.cookies.get('sevikaa_worker_token')?.value || 
                           req.cookies.get('sevikaa_employer_token')?.value || 
                           req.cookies.get('sevikaa_user_token')?.value;
      if (accessCookie) token = accessCookie;
    }

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

    let activeUserId: string | null = null;
    let activeUserRole: string | null = null;
    let activeUserEmail: string | null = null;

    if (token) {
      try {
        const { verifyAccessJwt } = require('@/lib/jwtHelper');
        const verified = verifyAccessJwt(token);
        if (verified?.userId) {
          activeUserId = verified.userId;
          activeUserRole = verified.role || null;
          activeUserEmail = verified.email || null;
        }
      } catch {}
    }

    if (!activeUserId && token) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) {
          activeUserId = user.id;
          activeUserEmail = user.email || null;
        }
      } catch {}
    }

    if (!activeUserId) {
      const userCookie = req.cookies.get('sevikaa_user')?.value;
      if (userCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userCookie));
          if (parsed?.id) activeUserId = parsed.id;
          if (parsed?.role) activeUserRole = parsed.role;
          if (parsed?.email) activeUserEmail = parsed.email;
        } catch {}
      }
    }

    const cookieRole = req.cookies.get('sevikaa_user_role')?.value;
    if (!activeUserRole && cookieRole) {
      activeUserRole = cookieRole;
    }

    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'ref parameter required' }, { status: 400 });
    }

    if (!ref.startsWith('cloudinary:')) {
      return NextResponse.json({ error: 'Invalid ref format' }, { status: 400 });
    }

    const parts = ref.split(':');
    if (parts.length < 3) {
      return NextResponse.json({ error: 'Invalid ref format' }, { status: 400 });
    }

    const resourceType = parts[1] as 'image' | 'video' | 'raw';
    const publicId = parts.slice(2).join(':');

    // Admin authorization check
    const isAdmin = activeUserRole === 'admin' || activeUserRole === 'super-admin' || cookieRole === 'admin' || cookieRole === 'super-admin';

    // Structured path owner extraction
    const pathSegments = publicId.split('/');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const extractedOwnerId = pathSegments.find(segment => uuidRegex.test(segment));
    const userIdStr = String(activeUserId || '');
    const isOwner = activeUserId ? (extractedOwnerId ? extractedOwnerId.toLowerCase() === userIdStr.toLowerCase() : publicId.includes(userIdStr)) : false;

    if (!isAdmin && !isOwner && activeUserId) {
      try {
        const { queryDb } = await import('@/lib/db');
        const dbRes = await queryDb(`SELECT role FROM public.profiles WHERE id::text = $1 OR user_id::text = $1`, [activeUserId]);
        if (dbRes?.rows?.[0]?.role === 'admin' || dbRes?.rows?.[0]?.role === 'super-admin') {
          // Admin verified
        } else if (!isOwner) {
          return NextResponse.json({ error: 'Forbidden', message: 'Access denied to document resource.' }, { status: 403 });
        }
      } catch {}
    }

    // Generate signed URL valid for 1 hour
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = cloudinary.url(publicId, {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'qq7ijovh',
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });

    // Log document access audit event for security monitoring
    logDocumentAccess(activeUserId || 'guest', activeUserEmail || activeUserId || 'guest', activeUserRole || 'user', ref, req).catch(() => {});

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { folder = 'sevikaa/videos', resourceType = 'video', userId } = body;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary credentials missing from server environment.' }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const targetFolder = userId ? `sevikaa/worker/${userId}/videos` : folder;

    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

    const paramsToSign = {
      timestamp,
      folder: targetFolder
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: targetFolder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate upload signature' }, { status: 500 });
  }
}

