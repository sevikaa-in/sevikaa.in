import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && firstIp !== '::1' && firstIp !== '127.0.0.1') return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp !== '::1' && realIp !== '127.0.0.1') return realIp.trim();
  return '127.0.0.1';
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  /** True only when Redis was unavailable and no in-memory fallback is permitted. */
  unavailable?: boolean;
}

/**
 * Internal helper: attempt a single sliding-window increment via Upstash Redis REST.
 * Returns { ok: true, result } on Redis success, { ok: false } on any Redis failure
 * (unreachable, non-2xx, no credentials configured).
 */
async function tryRedisRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<{ ok: true; result: RateLimitResult } | { ok: false }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken || redisUrl.includes('placeholder')) {
    return { ok: false };
  }
  try {
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);
    const key = `ratelimit:${identifier}:${Math.floor(now / windowMs)}`;
    const res = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds]
      ])
    });

    if (res.ok) {
      const data = await res.json();
      const count = data?.[0]?.result || 1;
      const remaining = Math.max(0, maxRequests - count);
      return {
        ok: true,
        result: {
          success: count <= maxRequests,
          limit: maxRequests,
          remaining,
          resetTime: now + windowMs
        }
      };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * CRITICAL endpoint rate limiter.
 *
 * Fails CLOSED with `unavailable: true` if Upstash Redis is unreachable or returns
 * an error. No in-memory fallback is permitted for critical endpoints.
 *
 * Callers MUST check `result.unavailable` and return HTTP 503 when it is true:
 *   "Rate limiting service temporarily unavailable."
 *
 * Use for: /api/auth/login-otp, /api/auth/refresh, /api/match,
 *           /api/employer/unlock, /api/employer/workers, /api/societies/workers
 */
export async function checkRateLimitCritical(
  identifier: string,
  maxRequests = 60,
  windowMs = 60000
): Promise<RateLimitResult> {
  const redisResult = await tryRedisRateLimit(identifier, maxRequests, windowMs);
  if (redisResult.ok) {
    return redisResult.result;
  }
  // Redis unavailable — fail closed, no in-memory fallback.
  console.error('[RateLimiter] CRITICAL: Redis unavailable — returning 503 (fail-closed).');
  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    resetTime: Date.now() + windowMs,
    unavailable: true
  };
}

/**
 * Distributed (Upstash Redis REST) + In-Memory Fallback Sliding Window Rate Limiter.
 *
 * Acceptable ONLY for non-critical / low-risk endpoints where a per-instance
 * in-memory approximation is an acceptable degraded mode when Redis is down.
 *
 * Non-critical endpoints currently using this: /api/admin/*, /api/super-admin/*
 */
export async function checkRateLimitAsync(
  identifier: string,
  maxRequests = 60,
  windowMs = 60000
): Promise<RateLimitResult> {
  const now = Date.now();

  const redisResult = await tryRedisRateLimit(identifier, maxRequests, windowMs);
  if (redisResult.ok) {
    return redisResult.result;
  }

  // In-memory fallback — acceptable only for non-critical endpoints.
  console.warn('[RateLimiter] Redis unavailable, using in-memory fallback (non-critical path).');
  if (!rateLimitStore[identifier] || now > rateLimitStore[identifier].resetTime) {
    rateLimitStore[identifier] = { count: 1, resetTime: now + windowMs };
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime: rateLimitStore[identifier].resetTime
    };
  }

  rateLimitStore[identifier].count += 1;
  const isAllowed = rateLimitStore[identifier].count <= maxRequests;

  return {
    success: isAllowed,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - rateLimitStore[identifier].count),
    resetTime: rateLimitStore[identifier].resetTime
  };
}

/**
 * Legacy synchronous in-memory rate limiter.
 * Only used by admin security guard internals; not for new endpoint code.
 */
export function checkRateLimit(
  reqOrIp: NextRequest | string,
  maxRequests = 60,
  windowMs = 60000
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const ip = typeof reqOrIp === 'string' ? reqOrIp : extractClientIp(reqOrIp);
  const now = Date.now();

  if (!rateLimitStore[ip] || now > rateLimitStore[ip].resetTime) {
    rateLimitStore[ip] = { count: 1, resetTime: now + windowMs };
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime: rateLimitStore[ip].resetTime
    };
  }

  rateLimitStore[ip].count += 1;

  if (rateLimitStore[ip].count > maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: rateLimitStore[ip].resetTime
    };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - rateLimitStore[ip].count,
    resetTime: rateLimitStore[ip].resetTime
  };
}

export async function checkOtpRateLimit(req: NextRequest): Promise<boolean> {
  const ip = extractClientIp(req);
  const res = await checkRateLimitAsync(`otp:${ip}`, 5, 60000); // 5 OTP requests per minute
  return res.success;
}

export async function checkAdminRateLimit(req: NextRequest): Promise<boolean> {
  const ip = extractClientIp(req);
  const res = await checkRateLimitAsync(`admin:${ip}`, 120, 60000); // 120 admin API requests per minute
  return res.success;
}
