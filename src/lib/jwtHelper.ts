import crypto from 'crypto';

/**
 * Creates a cryptographically signed Supabase HS256 JWT Access Token.
 * Accepted natively by Supabase JS Client (auth.getUser & auth.setSession) and PostgreSQL RLS (auth.uid()).
 */
export function signSupabaseJwt(userId: string, email?: string, phone?: string, userRole = 'worker'): string {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sevikaa-jwt-secret';

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'supabase',
    sub: userId,
    aud: 'authenticated',
    exp: now + (30 * 24 * 60 * 60), // 30 days session expiry
    iat: now,
    role: 'authenticated',
    email: email || `${userId}@sevikaa.in`,
    phone: phone || '',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { role: userRole }
  };

  const base64UrlEncode = (input: string) =>
    Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
