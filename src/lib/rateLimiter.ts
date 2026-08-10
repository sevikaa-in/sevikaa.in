import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

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

/**
 * Distributed (Upstash Redis REST) + In-Memory Fallback Sliding Window Rate Limiter
 */
export async function checkRateLimitAsync(
  identifier: string,
  maxRequests = 60,
  windowMs = 60000
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);

  // 1. Try Upstash Redis REST if credentials exist
  if (redisUrl && redisToken && !redisUrl.includes('placeholder')) {
    try {
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
          success: count <= maxRequests,
          limit: maxRequests,
          remaining,
          resetTime: now + windowMs
        };
      }
    } catch (redisErr) {
      console.warn('[RateLimiter] Upstash Redis check notice, using memory fallback:', redisErr);
    }
  }

  // 2. In-memory fallback
  if (!rateLimitStore[identifier] || now > rateLimitStore[identifier].resetTime) {
    rateLimitStore[identifier] = {
      count: 1,
      resetTime: now + windowMs
    };
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

export function checkRateLimit(
  req: NextRequest, 
  maxRequests = 60, 
  windowMs = 60000
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const ip = extractClientIp(req);
  const now = Date.now();

  if (!rateLimitStore[ip] || now > rateLimitStore[ip].resetTime) {
    rateLimitStore[ip] = {
      count: 1,
      resetTime: now + windowMs
    };
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
