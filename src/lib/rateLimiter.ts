import { NextRequest } from 'next/server';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * In-memory sliding window rate limiter for API routes.
 * @param req NextRequest
 * @param maxRequests Max requests per window (default 60)
 * @param windowMs Window duration in milliseconds (default 60000 = 1 minute)
 */
export function checkRateLimit(
  req: NextRequest, 
  maxRequests = 60, 
  windowMs = 60000
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
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
