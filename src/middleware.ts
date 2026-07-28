import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Extract bearer token from Authorization header or Supabase cookies
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

  // 2. Perform Server-Side Supabase Auth + Database Role Verification if token exists
  let verifiedRole: string | null = null;

  if (token && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role) {
          verifiedRole = profile.role;
        }
      }
    } catch (err) {
      console.error("Middleware Auth Verification error:", err);
    }
  }

  const effectiveRole = verifiedRole || roleCookie;

  // 3. Enforce Portal Boundary Restrictions (Role-Based Access Control)
  // Worker Portal Protection
  if (pathname.startsWith('/worker')) {
    if (effectiveRole && effectiveRole !== 'worker') {
      const redirectUrl = effectiveRole === 'employer' ? '/employer' : 
                         effectiveRole === 'super-admin' ? '/super-admin/dashboard' : 
                         effectiveRole === 'admin' ? '/admin/dashboard' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Employer Portal Protection
  if (pathname.startsWith('/employer')) {
    if (effectiveRole && effectiveRole !== 'employer') {
      const redirectUrl = effectiveRole === 'worker' ? '/worker' : 
                         effectiveRole === 'super-admin' ? '/super-admin/dashboard' : 
                         effectiveRole === 'admin' ? '/admin/dashboard' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Admin Portal Protection (Admin & Super Admin only)
  if (pathname.startsWith('/admin')) {
    if (effectiveRole && effectiveRole !== 'admin' && effectiveRole !== 'super-admin') {
      const redirectUrl = effectiveRole === 'worker' ? '/worker' : 
                         effectiveRole === 'employer' ? '/employer' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Super Admin Portal Protection (Super Admin ONLY)
  if (pathname.startsWith('/super-admin')) {
    if (effectiveRole && effectiveRole !== 'super-admin') {
      const redirectUrl = effectiveRole === 'admin' ? '/admin/dashboard' : 
                         effectiveRole === 'worker' ? '/worker' : 
                         effectiveRole === 'employer' ? '/employer' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/worker/:path*',
    '/employer/:path*',
    '/admin/:path*',
    '/super-admin/:path*'
  ],
};
