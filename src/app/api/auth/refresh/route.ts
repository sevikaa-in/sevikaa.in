import { NextRequest, NextResponse } from 'next/server';
import { withTxDb, queryDb } from '@/lib/db';
import { signSupabaseJwt, generateRefreshToken, hashRefreshToken } from '@/lib/jwtHelper';
import { checkRateLimitAsync, extractClientIp } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  // Distributed Rate Limit: Max 20 refresh attempts per minute per IP
  const rateLimit = await checkRateLimitAsync(extractClientIp(req), 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please wait before retrying.' }, { status: 429 });
  }

  try {
    let incomingRefreshToken: string | null = null;
    let isWebCookie = false;

    // 1. Extract refresh token from Web HttpOnly cookie or Mobile body/header
    const cookieToken = req.cookies.get('sevikaa_refresh_token')?.value;
    if (cookieToken) {
      incomingRefreshToken = cookieToken;
      isWebCookie = true;
    } else {
      const body = await req.json().catch(() => ({}));
      incomingRefreshToken = body.refresh_token || req.headers.get('x-refresh-token');
    }

    if (!incomingRefreshToken || typeof incomingRefreshToken !== 'string') {
      return NextResponse.json({ error: 'Unauthorized', message: 'Refresh token is required.' }, { status: 401 });
    }

    const tokenHash = hashRefreshToken(incomingRefreshToken);

    // 2. Perform Atomic Token Rotation & Reuse Detection inside a single PostgreSQL Transaction
    const rotationResult = await withTxDb(async (client) => {
      const tokenRes = await client.query(
        `SELECT id, user_id, session_id, family_id, is_revoked, expires_at 
         FROM public.refresh_tokens 
         WHERE token_hash = $1 
         FOR UPDATE`,
        [tokenHash]
      );

      if (!tokenRes?.rows?.length) {
        return { error: 'Invalid or unrecognized refresh session.', status: 401 };
      }

      const sessionRow = tokenRes.rows[0];

      // Reuse Detection: If a revoked refresh token is presented, revoke all tokens in the family
      if (sessionRow.is_revoked) {
        console.warn(`[auth/refresh] Compromised session reuse detected for family ${sessionRow.family_id}. Revoking all family sessions.`);
        await client.query(
          `UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE family_id = $1`,
          [sessionRow.family_id]
        );
        return { error: 'Session compromised. Please log in again.', status: 401, revokeCookie: true };
      }

      // Check expiration
      if (new Date(sessionRow.expires_at).getTime() < Date.now()) {
        await client.query(`UPDATE public.refresh_tokens SET is_revoked = TRUE WHERE id = $1`, [sessionRow.id]);
        return { error: 'Refresh session expired. Please log in again.', status: 401, revokeCookie: true };
      }

      // 3. Revoke current refresh token (Single-use token rotation)
      await client.query(
        `UPDATE public.refresh_tokens SET is_revoked = TRUE, last_used_at = NOW() WHERE id = $1`,
        [sessionRow.id]
      );

      // 4. Fetch user profile for token claims
      const userRes = await client.query(
        `SELECT id, email, phone, role FROM public.profiles WHERE id = $1 LIMIT 1`,
        [sessionRow.user_id]
      );

      const userProfile = userRes?.rows?.[0];
      if (!userProfile) {
        return { error: 'User profile no longer active.', status: 401 };
      }

      // 5. Issue new access token & new rotatable refresh token
      const newAccessToken = signSupabaseJwt(userProfile.id, userProfile.email, userProfile.phone, userProfile.role || 'worker');
      const newRefreshToken = generateRefreshToken();
      const newHash = hashRefreshToken(newRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      await client.query(
        `INSERT INTO public.refresh_tokens (user_id, token_hash, session_id, family_id, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [userProfile.id, newHash, sessionRow.session_id, sessionRow.family_id, expiresAt]
      );

      return {
        success: true,
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      };
    });

    if (rotationResult.error) {
      const res = NextResponse.json({ error: 'Unauthorized', message: rotationResult.error }, { status: rotationResult.status });
      if (isWebCookie || rotationResult.revokeCookie) {
        res.cookies.delete('sevikaa_refresh_token');
      }
      return res;
    }

    // 6. Formulate Response with Web Cookie & JSON payload
    const response = NextResponse.json({
      success: true,
      access_token: rotationResult.access_token,
      refresh_token: rotationResult.refresh_token,
      expires_in: 3600
    });

    if (isWebCookie && rotationResult.refresh_token) {
      response.cookies.set('sevikaa_refresh_token', rotationResult.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      });
    }

    return response;
  } catch (err: any) {
    console.error('[auth/refresh] Server error:', err?.message);
    return NextResponse.json({ error: 'Internal Server Error', message: 'Session refresh failed.' }, { status: 500 });
  }
}
