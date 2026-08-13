import crypto from 'crypto';

/**
 * Creates a cryptographically signed HS256 JWT Access Token.
 * Accepted natively by Supabase JS Client (auth.getUser) and PostgreSQL RLS (auth.uid()).
 * Strictly requires SUPABASE_JWT_SECRET.
 */
export function signSupabaseJwt(userId: string, email?: string, phone?: string, userRole = 'worker'): string {
  const secret = process.env.SUPABASE_JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'sevikaa_dev_jwt_secret_32_bytes_minimum_length_required' : undefined);
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
 * Creates a cryptographically signed, short-lived (15 min) HS256 Onboarding Token.
 * Used exclusively for completing worker onboarding. Cannot be used for normal APIs.
 */
export function signOnboardingJwt(userId: string, email?: string, phone?: string, userRole = 'worker'): string {
  const secret = process.env.SUPABASE_JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'sevikaa_dev_jwt_secret_32_bytes_minimum_length_required' : undefined);
  if (!secret) {
    throw new Error('CRITICAL: SUPABASE_JWT_SECRET environment variable is missing.');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'sevikaa-onboarding',
    sub: userId,
    aud: 'onboarding',
    purpose: 'onboarding',
    exp: now + 900, // 15 minutes short-lived duration
    iat: now,
    role: userRole,
    email: email || '',
    phone: phone || ''
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
 * Cryptographically verifies an Onboarding JWT.
 * Returns decoded payload if valid and unexpired; returns null if invalid, expired, or wrong purpose/role.
 */
export function verifyOnboardingJwt(token: string): { userId: string; role: string; email?: string; phone?: string; purpose: string } | null {
  if (!token) return null;

  const secret = process.env.SUPABASE_JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'sevikaa_dev_jwt_secret_32_bytes_minimum_length_required' : undefined);
  if (!secret) return null;

  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;

    const base64UrlDecode = (str: string) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return Buffer.from(base64, 'base64').toString('utf8');
    };

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp <= now) return null;
    if (payload.purpose !== 'onboarding' || payload.aud !== 'onboarding') return null;
    if (payload.role !== 'worker') return null;
    if (!payload.sub) return null;

    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      purpose: payload.purpose
    };
  } catch (err) {
    return null;
  }
}

/**
 * Safely decodes a JWT payload without verifying signature (for quick purpose checks).
 */
export function decodeJwtPayload(token: string): any | null {
  if (!token) return null;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return null;
  }
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
