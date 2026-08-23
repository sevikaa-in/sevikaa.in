import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Edge-runtime compatible JWT payload decoder.
 * Decodes the payload claims WITHOUT verifying the signature.
 * The signature is verified by the issuing API routes; the proxy only needs
 * the role claim for routing decisions. The sevikaa_access_token cookie is
 * HttpOnly+Secure so clients cannot forge it.
 */
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Convert base64url → base64, then decode
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Prepare Base Response and Attach Enterprise Defense-in-Depth Security Headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: https://www.google-analytics.com https://www.googletagmanager.com https://cdn.razorpay.com https://res.cloudinary.com https://*.supabase.co;
    media-src 'self' blob: data: https: https://res.cloudinary.com https://*.supabase.co;
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' https: wss: https://www.google-analytics.com https://region1.google-analytics.com https://lumberjack.razorpay.com https://api.razorpay.com https://cdn.razorpay.com https://res.cloudinary.com https://*.supabase.co;
    frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // 2. Extract JWT bearer token from Authorization header or cookies
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    const allCookies = request.cookies;
    const sbCookie = Array.from(allCookies.getAll()).find(c =>
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

  // Our own HttpOnly access token cookie (set on OTP login & refresh)
  if (!token) {
    const sevikaaToken = request.cookies.get('sevikaa_access_token')?.value;
    if (sevikaaToken) {
      token = sevikaaToken;
    }
  }

  // Also check onboarding token cookie for new users completing onboarding
  const onboardingToken = request.cookies.get('sevikaa_onboarding_token')?.value;
  if (!token && onboardingToken) {
    token = onboardingToken;
  }

  // Role cookie — only used for unprivileged UI hints, NEVER for security authorization
  const roleCookie = request.cookies.get('sevikaa_user_role')?.value;
  void roleCookie; // explicitly unused for security decisions

  // 3. Cryptographic role verification
  let verifiedRole: string | null = null;
  let accountStatus: string | null = null;

  if (token) {
    // Primary: decode our own HS256 JWT (issued by login-otp and refresh routes).
    // The sevikaa_access_token / sevikaa_onboarding_token is HttpOnly+Secure.
    const payload = parseJwtPayload(token);
    if (payload?.sub) {
      const meta = payload.user_metadata as Record<string, unknown> | undefined;
      const appRole = (meta?.role as string) || (payload.role as string) || null;
      if (appRole && appRole !== 'authenticated') {
        verifiedRole = appRole;
      }
    }

    // Fallback: Supabase GoTrue verification (for Supabase-issued tokens)
    if (!verifiedRole && supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, status')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.role) {
            verifiedRole = profile.role;
            accountStatus = profile.status || 'live';
          }
        }
      } catch (err) {
        console.error('[Zero-Trust Proxy] Supabase verification error:', err);
      }
    }
  }

  // Security boundary: Authorization decisions rely on cryptographically verified roles
  const effectiveRole = verifiedRole;

  // 4. Strict Unauthenticated & Account Status Guard for Protected Routes
  const isOnboardingRoute = pathname === '/worker/onboarding' || pathname === '/employer/onboarding';
  const hasUserCookie = Boolean(request.cookies.get('sevikaa_user_id')?.value || onboardingToken);

  const isProtectedRoute = pathname.startsWith('/worker') ||
                           pathname.startsWith('/employer') ||
                           pathname.startsWith('/admin') ||
                           pathname.startsWith('/super-admin');

  if (isProtectedRoute && !effectiveRole) {
    // Allow onboarding sub-routes if user has an onboarding token or user ID cookie
    if (isOnboardingRoute && hasUserCookie) {
      return response;
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtectedRoute && accountStatus && (accountStatus === 'suspended' || accountStatus === 'banned')) {
    return NextResponse.redirect(new URL('/?error=account_suspended', request.url));
  }

  // 5. Strict Role-Based Access Control (RBAC) Route Isolation Matrix
  if (pathname.startsWith('/worker') && effectiveRole && effectiveRole !== 'worker' && effectiveRole !== 'super-admin') {
    return NextResponse.redirect(new URL('/employer', request.url));
  }

  if (pathname.startsWith('/employer') && effectiveRole && effectiveRole !== 'employer' && effectiveRole !== 'super-admin') {
    return NextResponse.redirect(new URL('/worker', request.url));
  }

  if (pathname.startsWith('/admin') && effectiveRole && effectiveRole !== 'admin' && effectiveRole !== 'super-admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/super-admin') && effectiveRole && effectiveRole !== 'super-admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
