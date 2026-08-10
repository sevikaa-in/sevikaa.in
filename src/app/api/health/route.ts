import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET() {
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
      environment: {
        supabaseUrl: supabaseUrlConfigured ? 'configured' : 'unconfigured',
        supabaseServiceKey: serviceRoleConfigured ? 'configured' : 'unconfigured',
        razorpayWebhookSecret: razorpayConfigured ? 'configured' : 'unconfigured'
      }
    }
  }, { status: isSystemHealthy ? 200 : 503 });
}
