export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export interface ServerEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PHASE?: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  DATABASE_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  MONITORING_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  AWS_SES_ACCESS_KEY_ID?: string;
  AWS_SES_SECRET_ACCESS_KEY?: string;
  MSG91_AUTH_KEY?: string;
}

function isPlaceholder(value?: string): boolean {
  if (!value) return true;
  const val = value.trim().toLowerCase();
  return (
    val.includes('placeholder') ||
    val.includes('fake') ||
    val.includes('dummy') ||
    val === 'http://localhost' ||
    val === 'https://placeholder.supabase.co'
  );
}

export function validateServerEnv(): ServerEnv {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === 'true';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || '';
  const databaseUrl = process.env.DATABASE_URL || '';
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const monitoringSecret = process.env.MONITORING_SECRET || '';
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

  // In production runtime (outside static build phase), enforce strict fail-closed validation for required server credentials
  if (nodeEnv === 'production' && !isBuildPhase) {
    if (!supabaseUrl || isPlaceholder(supabaseUrl)) {
      throw new ConfigurationError('Production environment error: NEXT_PUBLIC_SUPABASE_URL is missing or placeholder.');
    }
    if (!supabaseAnonKey || isPlaceholder(supabaseAnonKey)) {
      throw new ConfigurationError('Production environment error: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or placeholder.');
    }
    if (!supabaseServiceKey || isPlaceholder(supabaseServiceKey)) {
      throw new ConfigurationError('Production environment error: SUPABASE_SERVICE_ROLE_KEY is missing or placeholder.');
    }
    if (!supabaseJwtSecret || isPlaceholder(supabaseJwtSecret)) {
      throw new ConfigurationError('Production environment error: SUPABASE_JWT_SECRET is missing or placeholder.');
    }
    if (!databaseUrl || isPlaceholder(databaseUrl)) {
      throw new ConfigurationError('Production environment error: DATABASE_URL is missing or placeholder.');
    }
    if (!redisUrl || isPlaceholder(redisUrl)) {
      throw new ConfigurationError('Production environment error: UPSTASH_REDIS_REST_URL is missing or placeholder.');
    }
    if (!redisToken || isPlaceholder(redisToken)) {
      throw new ConfigurationError('Production environment error: UPSTASH_REDIS_REST_TOKEN is missing or placeholder.');
    }
    if (!monitoringSecret || isPlaceholder(monitoringSecret)) {
      throw new ConfigurationError('Production environment error: MONITORING_SECRET is missing or placeholder.');
    }
    if (!razorpayKeyId || isPlaceholder(razorpayKeyId)) {
      throw new ConfigurationError('Production environment error: RAZORPAY_KEY_ID is missing or placeholder.');
    }
    if (!razorpayKeySecret || isPlaceholder(razorpayKeySecret)) {
      throw new ConfigurationError('Production environment error: RAZORPAY_KEY_SECRET is missing or placeholder.');
    }

    if (process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_SES_SECRET_ACCESS_KEY) {
      if (isPlaceholder(process.env.AWS_SES_ACCESS_KEY_ID) || isPlaceholder(process.env.AWS_SES_SECRET_ACCESS_KEY)) {
        throw new ConfigurationError('Production environment error: AWS SES credentials contain placeholder values.');
      }
    }
    if (process.env.MSG91_AUTH_KEY && isPlaceholder(process.env.MSG91_AUTH_KEY)) {
      throw new ConfigurationError('Production environment error: MSG91_AUTH_KEY contains placeholder value.');
    }
  }

  return {
    NODE_ENV: nodeEnv,
    NEXT_PHASE: process.env.NEXT_PHASE,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
    SUPABASE_JWT_SECRET: supabaseJwtSecret,
    DATABASE_URL: databaseUrl,
    UPSTASH_REDIS_REST_URL: redisUrl,
    UPSTASH_REDIS_REST_TOKEN: redisToken,
    MONITORING_SECRET: monitoringSecret,
    RAZORPAY_KEY_ID: razorpayKeyId,
    RAZORPAY_KEY_SECRET: razorpayKeySecret,
    AWS_SES_ACCESS_KEY_ID: process.env.AWS_SES_ACCESS_KEY_ID,
    AWS_SES_SECRET_ACCESS_KEY: process.env.AWS_SES_SECRET_ACCESS_KEY,
    MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY
  };
}

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = validateServerEnv();
  }
  return cachedEnv;
}

export function resetServerEnvCache(): void {
  cachedEnv = null;
}
