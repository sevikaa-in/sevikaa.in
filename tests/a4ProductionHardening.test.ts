import { validateServerEnv, ConfigurationError, resetServerEnvCache } from '../src/lib/env';
import { GET as getPricing } from '../src/app/api/pricing/route';
import { GET as getSocietiesWorkers } from '../src/app/api/societies/workers/route';
import { POST as createOrder } from '../src/app/api/payments/create-order/route';
import { PaymentService } from '../src/services/paymentService';
import { TransactionRepository } from '../src/repositories/transactionRepository';
import { invalidateCache } from '../src/lib/ttlCache';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

async function runA4Tests() {
  console.log('--- RUNNING A4 PRODUCTION HARDENING & P0 PAYMENT INTEGRITY TEST SUITE ---');
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
    invalidateCache('platform:pricing_config');
    process.env.DATABASE_URL = 'postgres://invalid:invalid@localhost:54321/invalid_db';
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

  // --- TEST I: Recursive server source tree audit for forbidden placeholder Supabase fallbacks ---
  try {
    function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          arrayOfFiles.push(fullPath);
        }
      });
      return arrayOfFiles;
    }

    const serverDirectories = [
      path.join(process.cwd(), 'src', 'app', 'api'),
      path.join(process.cwd(), 'src', 'lib'),
      path.join(process.cwd(), 'src', 'utils')
    ];

    const proxyFile = path.join(process.cwd(), 'src', 'proxy.ts');
    let allServerFiles: string[] = [];
    if (fs.existsSync(proxyFile)) allServerFiles.push(proxyFile);

    for (const dir of serverDirectories) {
      if (fs.existsSync(dir)) {
        getAllFiles(dir, allServerFiles);
      }
    }

    const forbiddenPatterns = [
      "|| 'https://placeholder.supabase.co'",
      '|| "https://placeholder.supabase.co"',
      "|| 'placeholder'",
      '|| "placeholder"'
    ];

    let violations: string[] = [];

    for (const filePath of allServerFiles) {
      if (filePath.endsWith('env.ts')) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
          const relPath = path.relative(process.cwd(), filePath);
          violations.push(`${relPath} (matches '${pattern}')`);
        }
      }
    }

    assert(violations.length === 0, 'Test I: Recursive server source scan has no forbidden placeholder fallbacks', violations.join(', '));
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

  // --- TEST K: Payment order creation does NOT use hardcoded pricing when pricing DB & cache are unavailable ---
  try {
    setupValidProductionEnv();
    invalidateCache('platform:pricing_config');
    process.env.DATABASE_URL = 'postgres://invalid:invalid@localhost:54321/invalid_db';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://invalid-db.supabase.co';
    resetServerEnvCache();

    const req = new NextRequest('http://localhost:3000/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_valid_bearer_token'
      },
      body: JSON.stringify({ planId: 'basic' })
    });

    const res = await createOrder(req);
    const body = await res.json().catch(() => ({}));

    const failsClosed = res.status === 503 || (res.status !== 200 && body.amount !== 29900);
    assert(failsClosed, `Test K: Payment order creation fails closed when pricing DB/cache unavailable (Got HTTP ${res.status})`);
  } catch (err: any) {
    assert(false, 'Test K', err.message);
  }

  // --- TEST L: Webhook Currency Mismatch Rejection ---
  try {
    setupValidProductionEnv();
    const result = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_usd_123',
            order_id: 'order_test_123',
            amount: 50000,
            currency: 'USD'
          }
        }
      }
    });

    assert(result.success === false && result.statusCode === 400, 'Test L: Webhook rejects non-INR currency payments');
  } catch (err: any) {
    assert(false, 'Test L', err.message);
  }

  // --- TEST M: TransactionRepository schema mapping helper ---
  try {
    assert(typeof TransactionRepository.findTransactionByPaymentId === 'function', 'Test M: TransactionRepository provides findTransactionByPaymentId schema mapping helper');
  } catch (err: any) {
    assert(false, 'Test M', err.message);
  }

  // --- TEST N: No hardcoded live Razorpay key fallback in source code ---
  try {
    const razorpayUtilPath = path.join(process.cwd(), 'src', 'utils', 'razorpay.ts');
    const content = fs.readFileSync(razorpayUtilPath, 'utf8');
    const hasLiveFallback = content.includes('rzp_live_');
    assert(!hasLiveFallback, 'Test N: Client Razorpay checkout contains no hardcoded rzp_live_ fallback key');
  } catch (err: any) {
    assert(false, 'Test N', err.message);
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
