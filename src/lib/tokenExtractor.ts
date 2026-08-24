import { NextRequest } from 'next/server';

export function extractBearerOrCookieToken(request: NextRequest): string | null {
  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  // 2. Check HttpOnly sevikaa_access_token cookie
  if (!token) {
    const sevikaaToken = request.cookies.get('sevikaa_access_token')?.value;
    if (sevikaaToken) {
      token = sevikaaToken;
    }
  }

  // 3. Fallback to Supabase / auth-token cookies
  if (!token) {
    const sbCookie = Array.from(request.cookies.getAll()).find(c => 
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

  return token;
}
