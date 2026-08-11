import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { hashRefreshToken } from '@/lib/jwtHelper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieToken = req.cookies.get('sevikaa_refresh_token')?.value;
    const incomingRefreshToken = cookieToken || body.refresh_token || req.headers.get('x-refresh-token');
    const logoutAll = body.all === true;

    if (incomingRefreshToken && typeof incomingRefreshToken === 'string') {
      const tokenHash = hashRefreshToken(incomingRefreshToken);

      if (logoutAll) {
        // Revoke all tokens in family across all devices
        const tokenRes = await queryDb(`SELECT family_id FROM public.refresh_tokens WHERE token_hash = $1 LIMIT 1`, [tokenHash]);
        if (tokenRes?.rows?.[0]?.family_id) {
          await queryDb(`UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE family_id = $1`, [tokenRes.rows[0].family_id]);
        }
      } else {
        // Revoke current device session_id
        const tokenRes = await queryDb(`SELECT session_id FROM public.refresh_tokens WHERE token_hash = $1 LIMIT 1`, [tokenHash]);
        if (tokenRes?.rows?.[0]?.session_id) {
          await queryDb(`UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE session_id = $1`, [tokenRes.rows[0].session_id]);
        } else {
          await queryDb(`UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1`, [tokenHash]);
        }
      }
    }

    const res = NextResponse.json({ success: true, message: logoutAll ? 'Logged out across all devices.' : 'Logged out successfully.' });
    res.cookies.delete('sevikaa_refresh_token');
    return res;
  } catch (err: any) {
    console.error('[auth/logout] Server error:', err?.message);
    const res = NextResponse.json({ success: true, message: 'Logged out.' });
    res.cookies.delete('sevikaa_refresh_token');
    return res;
  }
}
