import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory short-lived session token store (5 minute TTL)
const tokenStore = new Map<string, { userId: string; role: string; planId: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'usr_employer_1', role = 'employer', planId = 'pro_pass_1499' } = body;

    // Generate secure 32-byte hex token
    const token = `tk_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    tokenStore.set(token, { userId, role, planId, expiresAt });

    const checkoutUrl = `http://localhost:3000/employer/checkout?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
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
