import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { hashRefreshToken } from '@/lib/jwtHelper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieToken = req.cookies.get('sevikaa_refresh_token')?.value;
    const incomingRefreshToken = cookieToken || body.refresh_token || req.headers.get('x-refresh-token');

    if (incomingRefreshToken && typeof incomingRefreshToken === 'string') {
      const tokenHash = hashRefreshToken(incomingRefreshToken);

      // Find user_id and family_id for token
      const tokenRes = await queryDb(
        `SELECT user_id, family_id FROM public.refresh_tokens WHERE token_hash = $1 LIMIT 1`,
        [tokenHash]
      );

      if (tokenRes?.rows?.[0]) {
        const { user_id, family_id } = tokenRes.rows[0];
        // Revoke ALL active sessions for this user across all devices
        await queryDb(
          `UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 OR family_id = $2`,
          [user_id, family_id]
        );
      }
    }

    const res = NextResponse.json({ success: true, message: 'Logged out across all devices.' });
    res.cookies.delete('sevikaa_refresh_token');
    return res;
  } catch (err: any) {
    console.error('[auth/logout-all] Server error:', err?.message);
    const res = NextResponse.json({ error: 'Service Unavailable', message: 'Failed to revoke session on server.' }, { status: 503 });
    res.cookies.delete('sevikaa_refresh_token');
    return res;
  }
}
