import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { TokenManager } from '@/lib/tokenManager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Session
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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to generate upload tokens.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({ userId: null }));
    const { userId: bodyUserId } = body;

    // P0 #6 IDOR Fix: only admin/super-admin callers may target other user IDs
    // All other authenticated callers can only create tokens for themselves
    let targetUserId = user.id;
    if (bodyUserId && bodyUserId !== user.id) {
      // Verify caller has admin role before allowing cross-user token creation
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      const isAdmin = callerProfile?.role === 'admin' || callerProfile?.role === 'super-admin';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden', message: 'You can only create upload tokens for your own account.' }, { status: 403 });
      }
      targetUserId = bodyUserId;
    }

    // Generate and store persistent upload token using TokenManager
    const result = await TokenManager.createUploadToken(targetUserId, user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sevikaa.in';
    const uploadUrl = `${appUrl}/verify-upload?t=${result.rawToken}`;

    return NextResponse.json({ success: true, token: result.rawToken, uploadUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || searchParams.get('t');
    
    if (!token) {
      return NextResponse.json({ error: 'Valid upload token is required' }, { status: 400 });
    }

    // Verify token using persistent TokenManager
    const verification = await TokenManager.verifyAndConsumeToken(token);
    if (!verification.valid || !verification.userId) {
      return NextResponse.json({ error: verification.error || 'Invalid or expired upload token' }, { status: 400 });
    }

    const targetUserId = verification.userId;


    // Fetch candidate worker or employer details and existing media assets
    let worker: any = null;
    let role = 'worker';
    try {
      const res = await queryDb(
        `SELECT p.id, p.phone, p.email, p.status, p.role,
                COALESCE(wp.full_name, ep.company_name, p.name, 'Verification Lead') AS full_name, 
                COALESCE(wp.profile_picture_url, ep.avatar_url) AS profile_picture_url, 
                COALESCE(wp.aadhaar_front_url, ep.aadhaar_front_url) AS aadhaar_front_url, 
                COALESCE(wp.aadhaar_back_url, ep.aadhaar_back_url) AS aadhaar_back_url, 
                wp.video_url, ep.residency_proof_url
         FROM public.profiles p
         LEFT JOIN public.worker_profiles wp ON wp.user_id = p.id OR wp.id = p.id
         LEFT JOIN public.employer_profiles ep ON ep.user_id = p.id OR ep.id = p.id
         WHERE p.id = $1 LIMIT 1`,
        [targetUserId]
      );
      if (res?.rows?.[0]) {
        worker = res.rows[0];
        role = res.rows[0].role || 'worker';
      }
    } catch (e) {}

    // Check if profile is already approved/completed
    if (worker?.status === 'approved' || worker?.status === 'completed' || worker?.status === 'active') {
      return NextResponse.json({ 
        error: 'Verification has been completed and approved by Sevikaa. This upload link is now closed.',
        isApproved: true 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      role,
      workerName: worker?.full_name || 'Verification Lead',
      existingAssets: {
        profile_picture_url: worker?.profile_picture_url || null,
        aadhaar_front_url: worker?.aadhaar_front_url || null,
        aadhaar_back_url: worker?.aadhaar_back_url || null,
        video_url: worker?.video_url || null,
        residency_proof_url: worker?.residency_proof_url || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
}
