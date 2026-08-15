import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const monitoringSecret = process.env.MONITORING_SECRET || '';
  const authHeader = request.headers.get('authorization') || '';
  const secretHeader = request.headers.get('x-monitoring-secret') || '';

  // Fail closed — if MONITORING_SECRET is not configured, deny all access
  if (!monitoringSecret) {
    return NextResponse.json({ error: 'Service Unavailable', message: 'Internal health monitoring is not configured.' }, { status: 503 });
  }

  if (secretHeader !== monitoringSecret && !authHeader.includes(monitoringSecret)) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Valid monitoring secret required.' }, { status: 401 });
  }

  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await queryDb(`SELECT 1;`);
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = `unhealthy: ${err?.message || 'Database connection error'}`;
  }

  let redisStatus = 'unconfigured';
  let redisLatencyMs = 0;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken && !redisUrl.includes('placeholder')) {
    try {
      const rStart = Date.now();
      const rRes = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      redisLatencyMs = Date.now() - rStart;
      redisStatus = rRes.ok ? 'healthy' : `unhealthy: status ${rRes.status}`;
    } catch (rErr: any) {
      redisStatus = `unhealthy: ${rErr?.message || 'Redis ping failed'}`;
    }
  }

  const supabaseUrlConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'));
  const razorpayConfigured = !!(process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('placeholder'));
  const serviceRoleConfigured = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 50);

  const isSystemHealthy = dbStatus === 'healthy' && supabaseUrlConfigured;
  const totalResponseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: isSystemHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    latencyMs: totalResponseTimeMs,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs
      },
      environment: {
        supabaseUrl: supabaseUrlConfigured ? 'configured' : 'unconfigured',
        supabaseServiceKey: serviceRoleConfigured ? 'configured' : 'unconfigured',
        razorpayKeySecret: razorpayConfigured ? 'configured' : 'unconfigured'
      }
    }
  }, { status: isSystemHealthy ? 200 : 503 });
}
