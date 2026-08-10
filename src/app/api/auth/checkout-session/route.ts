import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// In-memory short-lived session token store (5 minute TTL)
const tokenStore = new Map<string, { userId: string; role: string; planId: string; expiresAt: number }>();

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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to initiate checkout sessions.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId = 'pro_pass_1499' } = body;
    const userId = user.id; // IDOR fix: derive strictly from authenticated user

    // Generate secure 32-byte hex token
    const sessionToken = `tk_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    tokenStore.set(sessionToken, { userId, role: 'employer', planId, expiresAt });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sevikaa.in';
    const checkoutUrl = `${appUrl}/employer/checkout?token=${sessionToken}`;

    return NextResponse.json({
      success: true,
      token: sessionToken,
      checkoutUrl,
      expiresAt: new Date(expiresAt).toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token || !tokenStore.has(token)) {
      return NextResponse.json({ success: false, error: 'Invalid or expired checkout token' }, { status: 400 });
    }

    const session = tokenStore.get(token)!;
    if (Date.now() > session.expiresAt) {
      tokenStore.delete(token);
      return NextResponse.json({ success: false, error: 'Checkout token has expired' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
