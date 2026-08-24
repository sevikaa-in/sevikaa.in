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
      // Revoke current device session_id
      const tokenRes = await queryDb(`SELECT session_id FROM public.refresh_tokens WHERE token_hash = $1 LIMIT 1`, [tokenHash]);
      if (tokenRes?.rows?.[0]?.session_id) {
        await queryDb(`UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE session_id = $1`, [tokenRes.rows[0].session_id]);
      } else {
        await queryDb(`UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1`, [tokenHash]);
      }
    }

    const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    res.cookies.delete('sevikaa_access_token');
    res.cookies.delete('sevikaa_refresh_token');
    res.cookies.delete('sevikaa_user_role');
    res.cookies.delete('sb-access-token');
    res.cookies.delete('sb-refresh-token');
    return res;
  } catch (err: any) {
    console.error('[auth/logout] Server error:', err?.message);
    const res = NextResponse.json({ error: 'Service Unavailable', message: 'Failed to revoke session on server.' }, { status: 503 });
    res.cookies.delete('sevikaa_access_token');
    res.cookies.delete('sevikaa_refresh_token');
    res.cookies.delete('sevikaa_user_role');
    return res;
  }
}
