import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

export function sanitizePayload(input: any): any {
  if (typeof input === 'string') {
    return input.trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizePayload);
  }
  if (input !== null && typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      sanitized[key] = sanitizePayload(input[key]);
    }
    return sanitized;
  }
  return input;
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
    const sbCookie = Array.from(request.cookies.getAll()).find((c: any) => 
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
  if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
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
    const supabase = createClient(supabaseUrl || 'https://unconfigured.local', supabaseAnonKey || 'unconfigured', {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired session token.' },
          { status: 401 }
        )
      };
    }

    // 4. Fetch User Profile Role from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role || user.user_metadata?.role || 'user') as string;
    const userStatus = profile?.status || 'active';

    if (userStatus === 'suspended' || userStatus === 'banned') {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Account is suspended or banned.' },
          { status: 403 }
        )
      };
    }

    // 5. Role-Based Access Control (RBAC) Enforcement
    const isSuperAdmin = userRole === 'super-admin';
    const isAdmin = userRole === 'admin' || isSuperAdmin;

    if (options.requiredRole === 'super-admin' && !isSuperAdmin) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Access denied. Super-admin role required.' },
          { status: 403 }
        )
      };
    }

    if (options.requiredRole === 'admin' && !isAdmin) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden', message: 'Access denied. Administrative role required.' },
          { status: 403 }
        )
      };
    }

    return {
      context: {
        userId: user.id,
        email: user.email || '',
        role: isSuperAdmin ? 'super-admin' : 'admin',
        status: userStatus,
        ipAddress: clientIp,
        userAgent
      }
    };
  } catch (err: any) {
    console.error('Admin security guard verification error:', err);
    return {
      errorResponse: NextResponse.json(
        { error: 'Internal Security Error', message: 'Security context verification failed.' },
        { status: 500 }
      )
    };
  }
}
