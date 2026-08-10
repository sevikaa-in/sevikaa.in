import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

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

    // Generate secure 32-byte hex token — store only the SHA-256 hash in DB
    const rawToken = `tk_${crypto.randomBytes(16).toString('hex')}`;
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes TTL

    // Persist to PostgreSQL — table created via migration 20260810000002
    await queryDb(
      `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, userId, planId, expiresAt]
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sevikaa.in';
    const checkoutUrl = `${appUrl}/employer/checkout?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      token: rawToken,
      checkoutUrl,
      expiresAt
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get('token');

    if (!rawToken) {
      return NextResponse.json({ success: false, error: 'Missing checkout token' }, { status: 400 });
    }

    const tokenHash = hashToken(rawToken);

    // Lookup by hash — table created via migration 20260810000002
    const result = await queryDb(
      `SELECT user_id, plan_id, expires_at, consumed_at
       FROM public.checkout_sessions
       WHERE token_hash = $1`,
      [tokenHash]
    );

    const session = result?.rows?.[0];
    if (!session) {
      return NextResponse.json({ success: false, error: 'Invalid or expired checkout token' }, { status: 400 });
    }

    if (session.consumed_at) {
      return NextResponse.json({ success: false, error: 'Checkout token has already been used' }, { status: 400 });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'Checkout token has expired' }, { status: 400 });
    }

    // Mark token as consumed (single-use)
    await queryDb(
      `UPDATE public.checkout_sessions SET consumed_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );

    return NextResponse.json({
      success: true,
      session: {
        userId: session.user_id,
        role: 'employer',
        planId: session.plan_id,
        expiresAt: session.expires_at,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
