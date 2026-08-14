import { validateServerEnv, ConfigurationError, resetServerEnvCache } from '../src/lib/env';
import { GET as getPricing } from '../src/app/api/pricing/route';
import { GET as getSocietiesWorkers } from '../src/app/api/societies/workers/route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

async function runA4Tests() {
  console.log('--- RUNNING A4 PRODUCTION HARDENING TEST SUITE ---');
  let passedCount = 0;
  let failedCount = 0;

  const originalEnv = { ...process.env };

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failedCount++;
    }
  }

  function setupValidProductionEnv() {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real-prod.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'real_prod_anon_key_long_string_1234567890';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'real_prod_service_role_key_long_string_1234567890_abcdefghijklmnopqrstuvwxyz';
    process.env.SUPABASE_JWT_SECRET = 'real_prod_jwt_secret_32_bytes_minimum_length_required';
    process.env.DATABASE_URL = 'postgres://user:pass@real-prod-db:5432/sevikaa';
    process.env.UPSTASH_REDIS_REST_URL = 'https://real-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'real_redis_token_123';
    process.env.MONITORING_SECRET = 'real_monitoring_secret_456';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_real_key_123';
    process.env.RAZORPAY_KEY_SECRET = 'real_razorpay_secret_789';
    resetServerEnvCache();
  }

  // --- TEST A: production + missing Supabase URL -> configuration failure ---
  try {
    setupValidProductionEnv();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    resetServerEnvCache();
    let threw = false;
    try {
      validateServerEnv();
    } catch (err: any) {
      threw = err instanceof ConfigurationError || err.message.includes('NEXT_PUBLIC_SUPABASE_URL');
    }
    assert(threw, 'Test A: production + missing Supabase URL throws configuration error');
  } catch (err: any) {
    assert(false, 'Test A', err.message);
  }

  // --- TEST B: production + missing service role key -> configuration failure ---
  try {
    setupValidProductionEnv();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetServerEnvCache();
    let threw = false;
    try {
      validateServerEnv();
    } catch (err: any) {
      threw = err instanceof ConfigurationError || err.message.includes('SUPABASE_SERVICE_ROLE_KEY');
    }
    assert(threw, 'Test B: production + missing service role key throws configuration error');
  } catch (err: any) {
    assert(false, 'Test B', err.message);
  }

  // --- TEST C: production + missing database URL -> configuration failure ---
  try {
    setupValidProductionEnv();
    delete process.env.DATABASE_URL;
    resetServerEnvCache();
    let threw = false;
    try {
      validateServerEnv();
    } catch (err: any) {
      threw = err instanceof ConfigurationError || err.message.includes('DATABASE_URL');
    }
    assert(threw, 'Test C: production + missing database URL throws configuration error');
  } catch (err: any) {
    assert(false, 'Test C', err.message);
  }

  // --- TEST D: production + missing Redis credentials -> configuration failure ---
  try {
    setupValidProductionEnv();
    delete process.env.UPSTASH_REDIS_REST_URL;
    resetServerEnvCache();
    let threw = false;
    try {
      validateServerEnv();
    } catch (err: any) {
      threw = err instanceof ConfigurationError || err.message.includes('UPSTASH_REDIS_REST_URL');
    }
    assert(threw, 'Test D: production + missing Redis credentials throws configuration error');
  } catch (err: any) {
    assert(false, 'Test D', err.message);
  }

  // --- TEST E: production + placeholder Supabase URL -> configuration failure ---
  try {
    setupValidProductionEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    resetServerEnvCache();
    let threw = false;
    try {
      validateServerEnv();
    } catch (err: any) {
      threw = err instanceof ConfigurationError || err.message.includes('placeholder');
    }
    assert(threw, 'Test E: production + placeholder Supabase URL throws configuration error');
  } catch (err: any) {
    assert(false, 'Test E', err.message);
  }

  // --- TEST F: pricing DB unavailable + no cache -> HTTP 503 ---
  try {
    setupValidProductionEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://invalid-non-existent-db.supabase.co';
    resetServerEnvCache();
    const res = await getPricing();
    assert(res.status === 503, `Test F: pricing DB unavailable + no cache returns 503 (Got HTTP ${res.status})`);
  } catch (err: any) {
    assert(false, 'Test F', err.message);
  }

  // --- TEST G: pricing valid cache -> returns cache ---
  try {
    setupValidProductionEnv();
    const { setCached } = await import('../src/lib/ttlCache');
    const mockPricingData = { testPlan: { price: '999', name: 'Mock Test Plan' } };
    setCached('platform:pricing_config', mockPricingData, 300);
    const res = await getPricing();
    const json = await res.json();
    assert(res.status === 200 && json.cached === true && json.pricing?.testPlan?.price === '999', 'Test G: pricing valid cache returns cached pricing');
  } catch (err: any) {
    assert(false, 'Test G', err.message);
  }

  // --- TEST H: societies workers DB unavailable + no cache -> 503 ---
  try {
    setupValidProductionEnv();
    process.env.DATABASE_URL = 'postgres://invalid:invalid@localhost:54321/invalid_db';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://invalid-db.supabase.co';
    resetServerEnvCache();
    const req = new NextRequest('http://localhost:3000/api/societies/workers');
    const res = await getSocietiesWorkers(req);
    assert(res.status === 503, `Test H: societies workers DB unavailable + no cache returns 503 (Got HTTP ${res.status})`);
  } catch (err: any) {
    assert(false, 'Test H', err.message);
  }

  // --- TEST I: Server code audit — no server code uses placeholder Supabase credentials as fallback ---
  try {
    const serverFiles = [
      'src/lib/supabaseClient.ts',
      'src/lib/supabaseAdminClient.ts',
      'src/lib/adminSecurityGuard.ts',
      'src/proxy.ts',
      'src/utils/resolveMediaUrl.ts'
    ];
    let foundFallback = false;
    for (const relPath of serverFiles) {
      const fullPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("|| 'https://placeholder.supabase.co'") || content.includes('|| "https://placeholder.supabase.co"')) {
          foundFallback = true;
          console.error(`Found fallback in ${relPath}`);
        }
      }
    }
    assert(!foundFallback, 'Test I: no server code uses placeholder Supabase credentials as fallback');
  } catch (err: any) {
    assert(false, 'Test I', err.message);
  }

  // --- TEST J: Mobile package declares expo-secure-store ---
  try {
    const mobilePkgPath = path.join(process.cwd(), 'mobile', 'package.json');
    const mobilePkg = JSON.parse(fs.readFileSync(mobilePkgPath, 'utf8'));
    const hasSecureStore = !!(mobilePkg.dependencies && mobilePkg.dependencies['expo-secure-store']);
    assert(hasSecureStore, `Test J: Mobile package declares expo-secure-store (${mobilePkg.dependencies?.['expo-secure-store']})`);
  } catch (err: any) {
    assert(false, 'Test J', err.message);
  }

  // Restore environment
  process.env = originalEnv;
  resetServerEnvCache();

  console.log(`--------------------------------------------------`);
  console.log(`TOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`--------------------------------------------------`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runA4Tests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
