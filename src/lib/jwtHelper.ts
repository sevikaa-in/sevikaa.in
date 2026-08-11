import crypto from 'crypto';

/**
 * Creates a cryptographically signed HS256 JWT Access Token.
 * Accepted natively by Supabase JS Client (auth.getUser) and PostgreSQL RLS (auth.uid()).
 * Strictly requires SUPABASE_JWT_SECRET.
 */
export function signSupabaseJwt(userId: string, email?: string, phone?: string, userRole = 'worker'): string {
  const secret = process.env.SUPABASE_JWT_SECRET || (process.env.NODE_ENV === 'test' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : undefined);
  if (!secret) {
    throw new Error('CRITICAL: SUPABASE_JWT_SECRET environment variable is missing.');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'supabase',
    sub: userId,
    aud: 'authenticated',
    exp: now + 3600, // 1 hour access token duration
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

/**
 * Generates an opaque 32-byte cryptographically random refresh token string.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a SHA-256 hash of the refresh token for secure database storage.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}
