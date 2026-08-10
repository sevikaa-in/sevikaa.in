import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export interface AdminSecurityContext {
  userId: string;
  email: string;
  role: 'admin' | 'super-admin';
  status: string;
  ipAddress: string;
  userAgent: string;
}

interface VerificationOptions {
  requiredRole?: 'admin' | 'super-admin';
  allowSuperAdminFallback?: boolean;
}

// In-Memory Rate Limiting Tracker (Token Bucket / IP Bucket)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

import { checkAdminRateLimit, extractClientIp } from '@/lib/rateLimiter';

/**
 * Server-Side Zero-Trust Security Verification Guard for Admin & Super Admin APIs
 */
export async function verifyAdminSecurityContext(
  request: NextRequest,
  options: VerificationOptions = { requiredRole: 'admin', allowSuperAdminFallback: true }
): Promise<{ context?: AdminSecurityContext; errorResponse?: NextResponse }> {
  // 1. Rate Limiting Check
  const clientIp = extractClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown User-Agent';

  const isRateAllowed = await checkAdminRateLimit(request);
  if (!isRateAllowed) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    };
  }

  // 2. Token Extraction
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

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

  // Handle Mock/Demo Sandbox Mode safely ONLY in non-production local development if Supabase is unconfigured
  if (process.env.NODE_ENV !== 'production' && supabaseUrl.includes('placeholder')) {
    const roleCookie = request.cookies.get('sevikaa_user_role')?.value;
    if (roleCookie === 'super-admin' || roleCookie === 'admin') {
      const isSuperAdmin = roleCookie === 'super-admin';
      if (options.requiredRole === 'super-admin' && !isSuperAdmin) {
        return {
          errorResponse: NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient privileges. Super Admin required.' },
            { status: 403 }
          )
        };
      }
      return {
        context: {
          userId: isSuperAdmin ? 'superadmin_dev_id' : 'admin_dev_id',
          email: isSuperAdmin ? 'yugayatra@sevikaa.in' : 'admin@sevikaa.in',
          role: isSuperAdmin ? 'super-admin' : 'admin',
          status: 'active',
          ipAddress: clientIp,
          userAgent
        }
      };
    }
  }

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. Missing token.' },
        { status: 401 }
      )
    };
  }

  // 3. Authenticate Session via Supabase Cryptographic Verification
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired session token.' },
          { status: 401 }
        )
      };
    }

    // 4. Verify Account & Role in Database directly
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role, status, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profErr || !profile) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'User profile not found or access denied.' },
          { status: 403 }
        )
      };
    }

    const userRole = profile.role as 'admin' | 'super-admin' | 'worker' | 'employer';
    const userStatus = profile.status || 'live';

    if (userStatus === 'suspended' || userStatus === 'banned') {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Account is suspended or deactivated.' },
          { status: 403 }
        )
      };
    }

    if (userRole !== 'admin' && userRole !== 'super-admin') {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Access restricted to administrative roles.' },
          { status: 403 }
        )
      };
    }

    // Enforce Privilege Hierarchy
    if (options.requiredRole === 'super-admin' && userRole !== 'super-admin') {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Operation restricted to Super Admin role only.' },
          { status: 403 }
        )
      };
    }

    return {
      context: {
        userId: user.id,
        email: profile.email || user.email || '',
        role: userRole,
        status: userStatus,
        ipAddress: clientIp,
        userAgent
      }
    };
  } catch (err: any) {
    console.error("[Zero-Trust Security Guard] Runtime Error:", err?.message || err);
    return {
      errorResponse: NextResponse.json(
        { error: 'Internal Server Error', message: 'Security validation failed.' },
        { status: 500 }
      )
    };
  }
}

/**
 * Sanitizes input payloads to prevent XSS / Prototype Pollution
 */
export function sanitizePayload<T>(input: T): T {
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '') as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizePayload(item)) as unknown as T;
  }

  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue; // Block prototype pollution
      }
      sanitizedObj[key] = sanitizePayload(value);
    }
    return sanitizedObj;
  }

  return input;
}
