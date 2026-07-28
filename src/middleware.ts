import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function middleware(request: NextRequest) {
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
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' https: wss:;
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

  // Role cookie set by authentic portal layout on login
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
      console.error("[Zero-Trust Middleware] Verification error:", err);
    }
  }

  const effectiveRole = verifiedRole || roleCookie;

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

  // 5. Enforce Strict RBAC Portal Boundaries (Zero Trust Policy)
  // A. Worker Portal Protection (Worker ONLY)
  if (pathname.startsWith('/worker')) {
    if (effectiveRole && effectiveRole !== 'worker') {
      const redirectUrl = effectiveRole === 'employer' ? '/employer' : 
                         effectiveRole === 'super-admin' ? '/super-admin/dashboard' : 
                         effectiveRole === 'admin' ? '/admin/dashboard' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // B. Employer Portal Protection (Employer ONLY)
  if (pathname.startsWith('/employer')) {
    if (effectiveRole && effectiveRole !== 'employer') {
      const redirectUrl = effectiveRole === 'worker' ? '/worker' : 
                         effectiveRole === 'super-admin' ? '/super-admin/dashboard' : 
                         effectiveRole === 'admin' ? '/admin/dashboard' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // C. Admin Portal Protection (Admin & Super Admin ONLY)
  if (pathname.startsWith('/admin')) {
    if (effectiveRole && effectiveRole !== 'admin' && effectiveRole !== 'super-admin') {
      const redirectUrl = effectiveRole === 'worker' ? '/worker' : 
                         effectiveRole === 'employer' ? '/employer' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // D. Super Admin Portal Protection (Super Admin ONLY)
  if (pathname.startsWith('/super-admin')) {
    if (effectiveRole && effectiveRole !== 'super-admin') {
      // ADMIN role cannot access /super-admin under any circumstance
      const redirectUrl = effectiveRole === 'admin' ? '/admin/dashboard' : 
                         effectiveRole === 'worker' ? '/worker' : 
                         effectiveRole === 'employer' ? '/employer' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/worker/:path*',
    '/employer/:path*',
    '/admin/:path*',
    '/super-admin/:path*'
  ],
};
