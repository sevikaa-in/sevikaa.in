import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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

  // 2. Extract JWT bearer token from Authorization header or Supabase Cookies
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

  // Role cookie set by authentic portal layout on login - only used for unprivileged UI hints, NEVER for security authorization
  const roleCookie = request.cookies.get('sevikaa_user_role')?.value;

  // 3. Perform Cryptographic Supabase Auth JWT Token & Database Role Verification
  let verifiedRole: string | null = null;
  let accountStatus: string | null = null;

  if (token && !supabaseUrl.includes('placeholder')) {
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
      console.error("[Zero-Trust Proxy] Verification error:", err);
    }
  }

  // Security boundary: Authorization decisions MUST rely strictly on cryptographically verified database roles, never client-set cookies
  const effectiveRole = verifiedRole;

  // 4. Strict Unauthenticated & Account Status Guard for Protected Routes
  const isProtectedRoute = pathname.startsWith('/worker') || 
                           pathname.startsWith('/employer') || 
                           pathname.startsWith('/admin') || 
                           pathname.startsWith('/super-admin');

  if (isProtectedRoute && !effectiveRole && !supabaseUrl.includes('placeholder')) {
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
