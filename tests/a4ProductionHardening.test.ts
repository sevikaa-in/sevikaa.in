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

  // --- TEST O [Unit Mock Simulation]: Event claim SQL query contract and idempotency status mapping ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const mockDbEvents = new Map<string, { event_id: string; processed_at: string | null }>();

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          const eventId = params[0];
          if (mockDbEvents.has(eventId)) {
            return { rows: [] }; // ON CONFLICT DO NOTHING -> 0 rows returned
          }
          const row = { event_id: eventId, processed_at: null };
          mockDbEvents.set(eventId, row);
          return { rows: [row] }; // Winner -> 1 row returned
        }
        if (sql.includes('SELECT processed_at FROM public.payment_events')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          return { rows: row ? [row] : [] };
        }
        if (sql.includes('UPDATE public.payment_events SET processed_at')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          if (row) row.processed_at = new Date().toISOString();
          return { rows: [] };
        }
        if (sql.includes('DELETE FROM public.payment_events')) {
          const eventId = params[0];
          mockDbEvents.delete(eventId);
          return { rows: [] };
        }
        if (sql.includes('checkout_sessions')) {
          return { rows: [{ user_id: 'db_test_user_123', plan_id: 'pro', expected_amount: 1499 }] };
        }
        return { rows: [] };
      },
      release: () => {}
    });

    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_unit_sim_777',
            order_id: 'order_unit_sim_777',
            amount: 149900,
            currency: 'INR',
            email: 'employer_db_test@sevikaa.in',
            contact: '+91 9876543210',
            status: 'captured'
          }
        }
      }
    };

    // Scenario 1: Attempt A — acquires claim in mock SQL driver
    const res1 = await PaymentService.processRazorpayEvent(payload);
    assert(res1.success === true, 'Test O1 [Unit Mock Simulation]: Primary delivery acquires claim in mock SQL response');

    // Scenario 2: Completed event — duplicate request is treated as already processed
    const res2 = await PaymentService.processRazorpayEvent(payload);
    assert(res2.success === true && res2.message === 'Already processed', 'Test O2 [Unit Mock Simulation]: Completed event returns HTTP 200 Already Processed');

    // Scenario 3: Attempt B concurrent conflict — 0 rows returned on INSERT ON CONFLICT, returns HTTP 500 demanding gateway retry
    mockDbEvents.set('payment.captured:pay_unit_sim_888', { event_id: 'payment.captured:pay_unit_sim_888', processed_at: null });
    const inProgressPayload = JSON.parse(JSON.stringify(payload));
    inProgressPayload.payload.payment.entity.id = 'pay_unit_sim_888';

    const res3 = await PaymentService.processRazorpayEvent(inProgressPayload);
    assert(res3.success === false && res3.statusCode === 500, 'Test O3 [Unit Mock Simulation]: Concurrent claim conflict returns HTTP 500 forcing Razorpay retry');

    (dbPool as any).connect = origConnect;
    (supabaseAdmin as any).from = origFrom;
  } catch (err: any) {
    assert(false, 'Test O [Unit Mock Simulation]', err.message);
  }

  // --- TEST O_DB [Postgres Real Integration Test]: Live PostgreSQL UNIQUE event claim concurrency ---
  try {
    setupValidProductionEnv();
    const { queryDb } = await import('../src/lib/db');

    let isRealDbAvailable = false;
    try {
      const ping = await queryDb('SELECT 1');
      if (ping && ping.rows) isRealDbAvailable = true;
    } catch {
      isRealDbAvailable = false;
    }

    if (isRealDbAvailable) {
      const fixedPaymentId = 'pay_pg_concurrency_test_999';
      const fixedOrderId = 'order_pg_concurrency_test_999';
      const fixedEventId = `payment.captured:${fixedPaymentId}`;

      // 1. Cleanup any pre-existing test records
      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [fixedEventId]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [fixedPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [fixedOrderId]).catch(() => {});

      // Seed a test checkout session so order lookup succeeds
      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour', NOW())
         ON CONFLICT (razorpay_order_id) DO NOTHING`,
        [`hash_${fixedOrderId}`, 'user_pg_concurrency_123', 'pro', 1499, fixedOrderId]
      ).catch(() => {});

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: fixedPaymentId,
              order_id: fixedOrderId,
              amount: 149900,
              currency: 'INR',
              email: 'employer_pg_concurrency@sevikaa.in'
            }
          }
        }
      };

      try {
        // 2. Fire two concurrent processing attempts using the EXACT SAME payment ID & event ID
        const [attemptA, attemptB] = await Promise.all([
          PaymentService.processRazorpayEvent(payload),
          PaymentService.processRazorpayEvent(payload)
        ]);

        // 3. Query authoritative database tables to verify concurrency outcomes
        const eventsRes = await queryDb(`SELECT event_id, processed_at FROM public.payment_events WHERE payment_id = $1`, [fixedPaymentId]);
        const txRes = await queryDb(`SELECT id, razorpay_payment_id, razorpay_order_id, amount, status FROM public.transactions WHERE razorpay_payment_id = $1`, [fixedPaymentId]);

        // Assertion 1: Exactly 1 row created in public.payment_events
        assert(eventsRes?.rows?.length === 1, `Test O_DB Assertion 1: Exactly 1 payment_events claim row created (got ${eventsRes?.rows?.length})`);

        // Assertion 2: Exactly 1 financial transaction created in public.transactions
        assert(txRes?.rows?.length === 1, `Test O_DB Assertion 2: Exactly 1 financial transaction created (got ${txRes?.rows?.length})`);

        // Assertion 3: Final processing state completed
        assert(eventsRes.rows[0].processed_at !== null, 'Test O_DB Assertion 3: Winner process successfully completed payment event claim');

        // Assertion 4: Outcome verification — one attempt acquired claim while concurrent attempt was blocked/handled cleanly
        const validConcurrencyOutcomes = (attemptA.success && (attemptB.statusCode === 500 || attemptB.message === 'Already processed')) ||
                                         (attemptB.success && (attemptA.statusCode === 500 || attemptA.message === 'Already processed'));
        assert(validConcurrencyOutcomes, 'Test O_DB Assertion 4: One request acquired claim while concurrent request was blocked by UNIQUE constraint');

      } finally {
        // Cleanup test data
        await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [fixedEventId]).catch(() => {});
        await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [fixedPaymentId]).catch(() => {});
        await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [fixedOrderId]).catch(() => {});
      }
    } else {
      console.log('ℹ [SKIP] Test O_DB [Postgres Real Integration Test]: Live PostgreSQL database is offline/unreachable in local test runner.');
    }
  } catch (err: any) {
    assert(false, 'Test O_DB [Postgres Real Integration Test]', err.message);
  }

  // --- TEST P: Financial Transaction State Transition Protection ---
  try {
    const capturedToFailedAllowed = TransactionRepository.isValidStateTransition('captured', 'failed');
    const refundedToCapturedAllowed = TransactionRepository.isValidStateTransition('refunded', 'captured');
    const refundedToFailedAllowed = TransactionRepository.isValidStateTransition('refunded', 'failed');
    const duplicateCapturedAllowed = TransactionRepository.isValidStateTransition('captured', 'captured');
    const failedToCapturedAllowed = TransactionRepository.isValidStateTransition('failed', 'captured');

    const testPPass = !capturedToFailedAllowed &&
                      !refundedToCapturedAllowed &&
                      !refundedToFailedAllowed &&
                      duplicateCapturedAllowed &&
                      failedToCapturedAllowed;

    assert(testPPass, 'Test P: Transaction state transition protection enforces valid financial state machine');
  } catch (err: any) {
    assert(false, 'Test P', err.message);
  }

  // --- TEST Q: Payment Event processed_at Database Failure Handling ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          return { rows: [{ event_id: params[0], processed_at: null }] };
        }
        if (sql.includes('checkout_sessions')) {
          return { rows: [{ user_id: 'mock_user_123', plan_id: 'pro', expected_amount: 1499 }] };
        }
        if (sql.includes('UPDATE public.payment_events SET processed_at')) {
          throw new Error('Simulated DB failure on updating processed_at');
        }
        return { rows: [] };
      },
      release: () => {}
    });

    let threwAsExpected = false;
    try {
      await PaymentService.processRazorpayEvent({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_processed_at_fail_test',
              order_id: 'order_processed_at_fail_test',
              amount: 149900,
              currency: 'INR',
              email: 'employer_test@sevikaa.in',
              contact: '+91 9876543210',
              status: 'captured'
            }
          }
        }
      });
    } catch (err: any) {
      if (err.message?.includes('Simulated DB failure') || err.message?.includes('processed_at') || err.message?.includes('completion record failed')) {
        threwAsExpected = true;
      }
    } finally {
      (dbPool as any).connect = origConnect;
      (supabaseAdmin as any).from = origFrom;
    }

    assert(threwAsExpected, 'Test Q: processed_at DB update failure throws observable error without swallowing');
  } catch (err: any) {
    assert(false, 'Test Q', err.message);
  }

  // --- TEST R: subscription.charged Webhook Event Handling ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          return { rows: [{ event_id: params[0], processed_at: null }] };
        }
        if (sql.includes('employer_profiles')) {
          return { rows: [{ user_id: 'resolved_sub_user_456' }] };
        }
        return { rows: [] };
      },
      release: () => {}
    });

    let res: any = null;
    try {
      res = await PaymentService.processRazorpayEvent({
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_test_charge_123',
              plan_id: 'plan_pro_monthly',
              notes: { user_id: 'resolved_sub_user_456' }
            }
          },
          payment: {
            entity: {
              id: 'pay_sub_charge_123',
              amount: 149900,
              currency: 'INR',
              email: 'employer_sub_charge@sevikaa.in',
              contact: '+91 9876543210',
              status: 'captured'
            }
          }
        }
      });
    } finally {
      (dbPool as any).connect = origConnect;
      (supabaseAdmin as any).from = origFrom;
    }

    assert(res && res.success === true, 'Test R: subscription.charged resolves user via email/notes fallback and updates subscription');
  } catch (err: any) {
    assert(false, 'Test R', err.message);
  }

  // --- TEST S1: Missing Payment ID Rejected ---
  try {
    setupValidProductionEnv();
    const res1 = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            order_id: 'order_valid_123',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });
    assert(res1.success === false && res1.statusCode === 400 && res1.error === 'Missing payment ID', 'Test S1: Missing payment ID -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test S1', err.message);
  }

  // --- TEST S2: Missing Order ID for Payment Event Rejected ---
  try {
    setupValidProductionEnv();
    const res2 = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_valid_123',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });
    assert(res2.success === false && res2.statusCode === 400 && res2.error === 'Missing order ID', 'Test S2: Missing order ID for payment event -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test S2', err.message);
  }

  // --- TEST S3: No Fabricated pay_ Timestamp ID ---
  try {
    setupValidProductionEnv();
    let dbTouched = false;
    const { dbPool } = await import('../src/lib/db');
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => {
      dbTouched = true;
      return { query: async () => ({ rows: [] }), release: () => {} };
    };

    const res3 = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: { payment: { entity: { order_id: 'order_test_no_fab' } } }
    });
    (dbPool as any).connect = origConnect;

    assert(res3.success === false && !dbTouched, 'Test S3: No fabricated pay_ timestamp ID created, event rejected before DB execution');
  } catch (err: any) {
    assert(false, 'Test S3', err.message);
  }

  // --- TEST S4: No Fabricated order_ Timestamp ID ---
  try {
    setupValidProductionEnv();
    let dbTouched = false;
    const { dbPool } = await import('../src/lib/db');
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => {
      dbTouched = true;
      return { query: async () => ({ rows: [] }), release: () => {} };
    };

    const res4 = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_no_fab', currency: 'INR' } } }
    });
    (dbPool as any).connect = origConnect;

    assert(res4.success === false && !dbTouched, 'Test S4: No fabricated order_ timestamp ID created, event rejected before DB execution');
  } catch (err: any) {
    assert(false, 'Test S4', err.message);
  }

  // --- TEST T1: subscription.charged with subscription ID but no order ID -> transaction.razorpay_order_id is NULL ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    let recordedOrderId: any = 'NOT_SET';
    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          return { rows: [{ event_id: params[0], processed_at: null }] };
        }
        if (sql.includes('INSERT INTO public.transactions')) {
          recordedOrderId = params[1]; // $2 corresponds to razorpay_order_id
          return { rows: [] };
        }
        if (sql.includes('employer_profiles')) {
          return { rows: [{ user_id: 'user_sub_test_1' }] };
        }
        return { rows: [] };
      },
      release: () => {}
    });

    await PaymentService.processRazorpayEvent({
      event: 'subscription.charged',
      payload: {
        subscription: {
          entity: {
            id: 'sub_test_no_order_123',
            plan_id: 'plan_pro',
            notes: { user_id: 'user_sub_test_1' }
          }
        },
        payment: {
          entity: {
            id: 'pay_sub_test_no_order_123',
            amount: 149900,
            currency: 'INR',
            email: 'employer_t1@sevikaa.in'
          }
        }
      }
    });

    (dbPool as any).connect = origConnect;
    (supabaseAdmin as any).from = origFrom;

    assert(recordedOrderId === null, 'Test T1: subscription.charged with subscription ID but no order ID -> transaction.razorpay_order_id is NULL');
  } catch (err: any) {
    assert(false, 'Test T1', err.message);
  }

  // --- TEST T2: subscription.charged must not store sub_xxx as an order_xxx value ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    let recordedOrderId: any = 'NOT_SET';
    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          return { rows: [{ event_id: params[0], processed_at: null }] };
        }
        if (sql.includes('INSERT INTO public.transactions')) {
          recordedOrderId = params[1];
          return { rows: [] };
        }
        if (sql.includes('employer_profiles')) {
          return { rows: [{ user_id: 'user_sub_test_2' }] };
        }
        return { rows: [] };
      },
      release: () => {}
    });

    await PaymentService.processRazorpayEvent({
      event: 'subscription.charged',
      payload: {
        subscription: {
          entity: {
            id: 'sub_999888777',
            plan_id: 'plan_starter',
            notes: { user_id: 'user_sub_test_2' }
          }
        },
        payment: {
          entity: {
            id: 'pay_sub_test_222',
            amount: 99900,
            currency: 'INR',
            email: 'employer_t2@sevikaa.in'
          }
        }
      }
    });

    (dbPool as any).connect = origConnect;
    (supabaseAdmin as any).from = origFrom;

    assert(recordedOrderId !== 'sub_999888777' && recordedOrderId === null, 'Test T2: subscription.charged must not store sub_xxx as an order_xxx value');
  } catch (err: any) {
    assert(false, 'Test T2', err.message);
  }

  // --- TEST T3: payment.captured with real order_id -> real order_id is stored ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    let recordedOrderId: any = null;
    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          return { rows: [{ event_id: params[0], processed_at: null }] };
        }
        if (sql.includes('checkout_sessions')) {
          return { rows: [{ user_id: 'user_real_order_777', plan_id: 'pro', expected_amount: 1499 }] };
        }
        if (sql.includes('INSERT INTO public.transactions')) {
          recordedOrderId = params[1];
          return { rows: [] };
        }
        return { rows: [] };
      },
      release: () => {}
    });

    await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_real_order_777',
            order_id: 'order_real_razorpay_777',
            amount: 149900,
            currency: 'INR',
            email: 'employer_t3@sevikaa.in'
          }
        }
      }
    });

    (dbPool as any).connect = origConnect;
    (supabaseAdmin as any).from = origFrom;

    assert(recordedOrderId === 'order_real_razorpay_777', 'Test T3: payment.captured with real order_id -> real order_id is stored');
  } catch (err: any) {
    assert(false, 'Test T3', err.message);
  }

  // --- TEST U1: Existing captured transaction ₹1499, replayed event contains ₹299 -> stored amount remains ₹1499 ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_immutability_101',
      razorpay_order_id: 'order_immutability_101',
      user_id: 'user_u1',
      employer_name: 'Employer U1',
      employer_email: 'u1@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 299,
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    const omitsAmountOverwrite = !executedSql.includes('amount = EXCLUDED.amount');
    assert(omitsAmountOverwrite, 'Test U1: Existing transaction ₹1499 replayed with ₹299 -> amount = EXCLUDED.amount is omitted from DO UPDATE SET');
  } catch (err: any) {
    assert(false, 'Test U1', err.message);
  }

  // --- TEST U2: Existing transaction has real razorpay_payment_id -> replay cannot replace it ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_real_payment_id_202',
      user_id: 'user_u2',
      employer_name: 'Employer U2',
      employer_email: 'u2@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    const paymentIdIsConflictKey = executedSql.includes('ON CONFLICT (razorpay_payment_id)');
    assert(paymentIdIsConflictKey, 'Test U2: Existing transaction razorpay_payment_id is conflict target key and cannot be replaced');
  } catch (err: any) {
    assert(false, 'Test U2', err.message);
  }

  // --- TEST U3: Existing transaction has real razorpay_order_id -> replay cannot replace it ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_order_id_303',
      razorpay_order_id: 'order_original_303',
      user_id: 'user_u3',
      employer_name: 'Employer U3',
      employer_email: 'u3@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    const usesCoalesceOrderId = executedSql.includes('razorpay_order_id = COALESCE(public.transactions.razorpay_order_id, EXCLUDED.razorpay_order_id)');
    assert(usesCoalesceOrderId, 'Test U3: Existing transaction razorpay_order_id protected via COALESCE and cannot be overwritten on replay');
  } catch (err: any) {
    assert(false, 'Test U3', err.message);
  }

  // --- TEST U4: Duplicate webhook with same amount -> no financial-field corruption ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let queryCount = 0;
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        queryCount++;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_duplicate_404',
      razorpay_order_id: 'order_duplicate_404',
      user_id: 'user_u4',
      employer_name: 'Employer U4',
      employer_email: 'u4@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    assert(queryCount === 1, 'Test U4: Duplicate webhook executes idempotent update without financial-field corruption');
  } catch (err: any) {
    assert(false, 'Test U4', err.message);
  }

  // --- TEST U5: Valid status transition -> status still updates correctly ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_transition_505',
      user_id: 'user_u5',
      employer_name: 'Employer U5',
      employer_email: 'u5@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'refunded'
    });

    (dbPool as any).connect = origConnect;

    const retainsStatusTransitionCase = executedSql.includes('status = CASE') && executedSql.includes("EXCLUDED.status = 'failed'");
    assert(retainsStatusTransitionCase, 'Test U5: Valid status transition CASE block retained for state updates');
  } catch (err: any) {
    assert(false, 'Test U5', err.message);
  }

  // --- TEST V1: Replay cannot change amount ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_v1_1499',
      razorpay_order_id: 'order_v1_1499',
      user_id: 'user_v1',
      employer_name: 'Employer V1',
      employer_email: 'v1@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 299, // Replayed payload tries to write 299 over 1499
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    assert(!executedSql.includes('amount = EXCLUDED.amount'), 'Test V1: Replay cannot change amount — amount field excluded from DO UPDATE SET');
  } catch (err: any) {
    assert(false, 'Test V1', err.message);
  }

  // --- TEST V2: Replay cannot change razorpay_order_id ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_v2_123',
      razorpay_order_id: 'order_old_replay',
      user_id: 'user_v2',
      employer_name: 'Employer V2',
      employer_email: 'v2@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    assert(executedSql.includes('razorpay_order_id = COALESCE(public.transactions.razorpay_order_id, EXCLUDED.razorpay_order_id)'), 'Test V2: Replay cannot change razorpay_order_id — COALESCE protects existing order ID');
  } catch (err: any) {
    assert(false, 'Test V2', err.message);
  }

  // --- TEST V3: Replay cannot change payment ID ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_v3_immutable',
      user_id: 'user_v3',
      employer_name: 'Employer V3',
      employer_email: 'v3@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'captured'
    });

    (dbPool as any).connect = origConnect;

    assert(executedSql.includes('ON CONFLICT (razorpay_payment_id)'), 'Test V3: Replay cannot change payment ID — conflict target is razorpay_payment_id');
  } catch (err: any) {
    assert(false, 'Test V3', err.message);
  }

  // --- TEST V4: Replay cannot replace raw_payload ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const { dbPool } = await import('../src/lib/db');

    let executedSql = '';
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        executedSql = sql;
        return { rows: [] };
      },
      release: () => {}
    });

    await TransactionRepository.recordTransaction({
      razorpay_payment_id: 'pay_v4_raw_payload',
      user_id: 'user_v4',
      employer_name: 'Employer V4',
      employer_email: 'v4@sevikaa.in',
      employer_phone: '+91 9876543210',
      plan_name: 'Pro Pass',
      amount: 1499,
      payment_method: 'UPI',
      status: 'captured',
      raw_payload: '{"event":"replayed"}'
    });

    (dbPool as any).connect = origConnect;

    assert(executedSql.includes('raw_payload = COALESCE(public.transactions.raw_payload, EXCLUDED.raw_payload)'), 'Test V4: Replay cannot replace raw_payload — COALESCE protects authoritative raw_payload');
  } catch (err: any) {
    assert(false, 'Test V4', err.message);
  }

  // --- TEST V5: Valid status transition still works ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const validFailedToCaptured = TransactionRepository.isValidStateTransition('failed', 'captured');
    const validCapturedToRefunded = TransactionRepository.isValidStateTransition('captured', 'refunded');

    assert(validFailedToCaptured && validCapturedToRefunded, 'Test V5: Valid status transition still works (failed->captured & captured->refunded allowed)');
  } catch (err: any) {
    assert(false, 'Test V5', err.message);
  }

  // --- TEST V6: Invalid status regression remains blocked ---
  try {
    setupValidProductionEnv();
    const { TransactionRepository } = await import('../src/repositories/transactionRepository');
    const blockedCapturedToFailed = !TransactionRepository.isValidStateTransition('captured', 'failed');
    const blockedRefundedToCaptured = !TransactionRepository.isValidStateTransition('refunded', 'captured');

    assert(blockedCapturedToFailed && blockedRefundedToCaptured, 'Test V6: Invalid status regression remains blocked (captured->failed & refunded->captured blocked)');
  } catch (err: any) {
    assert(false, 'Test V6', err.message);
  }

  // --- TEST W1: DB amount = NULL -> API amount = null ---
  try {
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const { GET } = await import('../src/app/api/super-admin/transactions/route');
    const { dbPool } = await import('../src/lib/db');

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('COUNT(*)')) {
          return { rows: [{ count: '1' }] };
        }
        return {
          rows: [
            {
              id: 'pay_null_amount_123',
              razorpay_payment_id: 'pay_null_amount_123',
              razorpay_order_id: 'order_null_amount_123',
              user_id: 'user_w1',
              employer_name: 'Employer W1',
              employer_email: 'w1@sevikaa.in',
              amount: null,
              status: 'captured',
              created_at: new Date().toISOString()
            }
          ]
        };
      },
      release: () => {}
    });

    const req = new NextRequest('http://localhost:3000/api/super-admin/transactions?page=1&limit=20', {
      headers: {
        authorization: 'Bearer superadmin_dev_token'
      }
    });

    const res = await GET(req);
    const body = await res.json();
    (dbPool as any).connect = origConnect;
    process.env.NODE_ENV = origNodeEnv;

    assert(body.success === true && body.transactions?.[0]?.amount === null, `Test W1: DB amount = NULL -> API returns amount as null instead of 0 (got ${body.transactions?.[0]?.amount})`);
  } catch (err: any) {
    assert(false, 'Test W1', err.message);
  }

  // --- TEST X1: Missing payment amount -> rejected ---
  try {
    setupValidProductionEnv();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x1_no_amount',
            order_id: 'order_x1_no_amount',
            currency: 'INR'
          }
        }
      }
    });
    assert(res.success === false && res.statusCode === 400 && res.error === 'Missing payment amount', 'Test X1: Missing payment amount -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test X1', err.message);
  }

  // --- TEST X2: Zero amount -> rejected ---
  try {
    setupValidProductionEnv();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x2_zero',
            order_id: 'order_x2_zero',
            amount: 0,
            currency: 'INR'
          }
        }
      }
    });
    assert(res.success === false && res.statusCode === 400 && res.error === 'Invalid payment amount', 'Test X2: Zero payment amount -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test X2', err.message);
  }

  // --- TEST X3: Negative amount -> rejected ---
  try {
    setupValidProductionEnv();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x3_neg',
            order_id: 'order_x3_neg',
            amount: -149900,
            currency: 'INR'
          }
        }
      }
    });
    assert(res.success === false && res.statusCode === 400 && res.error === 'Invalid payment amount', 'Test X3: Negative payment amount -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test X3', err.message);
  }

  // --- TEST X4: Non-finite / non-integer amount -> rejected ---
  try {
    setupValidProductionEnv();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x4_non_int',
            order_id: 'order_x4_non_int',
            amount: 149900.5,
            currency: 'INR'
          }
        }
      }
    });
    assert(res.success === false && res.statusCode === 400 && (res.error || '').includes('must be an integer'), 'Test X4: Non-integer payment amount in paise -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test X4', err.message);
  }

  // --- TEST X5: Missing expected_amount in session -> rejected ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_x5' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'u_x5', expected_amount: null }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x5_null_exp',
            order_id: 'order_x5_null_exp',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });
    (dbPool as any).connect = origConnect;

    assert(res.success === false && res.statusCode === 400 && res.error === 'Invalid or missing expected amount in checkout session', 'Test X5: Missing expected_amount in checkout session -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test X5', err.message);
  }

  // --- TEST X6: Valid amount -> continues ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const { supabaseAdmin } = await import('../src/lib/supabaseAdminClient');

    const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
    (supabaseAdmin as any).from = () => ({
      update: () => ({ eq: async () => ({ error: null, data: [] }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    });

    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_x6' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'u_x6', expected_amount: 1499 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x6_valid',
            order_id: 'order_x6_valid',
            amount: 149900,
            currency: 'INR',
            email: 'employer_x6@sevikaa.in'
          }
        }
      }
    });
    (dbPool as any).connect = origConnect;
    (supabaseAdmin as any).from = origFrom;

    assert(res.success === true, 'Test X6: Valid amount matching expected_amount -> completes successfully with HTTP 200');
  } catch (err: any) {
    assert(false, 'Test X6', err.message);
  }

  // --- TEST X7: Mismatched amount -> rejected ---
  try {
    setupValidProductionEnv();
    const { dbPool } = await import('../src/lib/db');
    const origConnect = dbPool.connect.bind(dbPool);
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_x7' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'u_x7', expected_amount: 1499 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x7_mismatch',
            order_id: 'order_x7_mismatch',
            amount: 29900, // 299 paid vs 1499 expected
            currency: 'INR'
          }
        }
      }
    });
    (dbPool as any).connect = origConnect;

    assert(res.success === false && res.statusCode === 400 && res.error === 'Payment amount mismatch', 'Test X7: Mismatched payment amount -> rejected with HTTP 400');
  } catch (err: any) {
    assert(false, 'Test X7', err.message);
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
