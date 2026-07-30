import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import crypto from 'crypto';

// In-memory token store for 8-character short token mapping
const tokenStore = new Map<string, { userId: string; expiry: number }>();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate ultra-compact 8-character token (e.g. "a8f2k9x1")
    const shortToken = crypto.randomBytes(4).toString('hex');
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days TTL

    tokenStore.set(shortToken, { userId, expiry });

    // Fallback URL format (compact): https://www.sevikaa.in/verify-upload?t=a8f2k9x1
    const uploadUrl = `https://www.sevikaa.in/verify-upload?t=${shortToken}`;

    return NextResponse.json({ success: true, token: shortToken, uploadUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let token = searchParams.get('token') || searchParams.get('t');
    let userIdParam = searchParams.get('userId');
    
    if (!token && !userIdParam) {
      return NextResponse.json({ error: 'Token or userId is required' }, { status: 400 });
    }

    let targetUserId = userIdParam || '';

    if (!targetUserId && token) {
      // 1. Check if token is a direct UUID (36 chars with hyphens e.g. 48cfb80b-f874-4a0c-ae4b-e1ae06caa237)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      if (isUuid) {
        targetUserId = token;
      }
      // 2. Check in-memory short token store
      else if (tokenStore.has(token)) {
        const entry = tokenStore.get(token)!;
        if (Date.now() > entry.expiry) {
          tokenStore.delete(token);
          return NextResponse.json({ error: 'Upload link expired' }, { status: 410 });
        }
        targetUserId = entry.userId;
      } else {
        // 3. Fallback to base64url decoding if long legacy token is passed
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
          if (Date.now() > decoded.expiry) {
            return NextResponse.json({ error: 'Upload link expired' }, { status: 410 });
          }
          targetUserId = decoded.userId;
        } catch (e) {
          return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }
      }
    }

    // Fetch candidate worker details and existing media assets
    let worker: any = null;
    try {
      const res = await queryDb(
        `SELECT p.id, p.phone, p.email, p.status, 
                wp.full_name, wp.profile_picture_url, wp.aadhaar_front_url, wp.aadhaar_back_url, wp.video_url
         FROM public.profiles p
         LEFT JOIN public.worker_profiles wp ON wp.user_id = p.id OR wp.id = p.id
         WHERE p.id = $1 LIMIT 1`,
        [targetUserId]
      );
      if (res?.rows?.[0]) worker = res.rows[0];
    } catch (e) {}

    // Check if worker profile is already approved/completed
    if (worker?.status === 'approved' || worker?.status === 'completed') {
      return NextResponse.json({ 
        error: 'Verification has been completed and approved by Sevikaa. This upload link is now closed.',
        isApproved: true 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      workerName: worker?.full_name || 'Worker Candidate',
      existingAssets: {
        profile_picture_url: worker?.profile_picture_url || null,
        aadhaar_front_url: worker?.aadhaar_front_url || null,
        aadhaar_back_url: worker?.aadhaar_back_url || null,
        video_url: worker?.video_url || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
}
