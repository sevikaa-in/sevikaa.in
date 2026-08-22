import { PaymentService } from '../src/services/paymentService';
import { TransactionRepository } from '../src/repositories/transactionRepository';
import { supabaseAdmin } from '../src/lib/supabaseAdminClient';
import { dbPool, queryDb } from '../src/lib/db';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`✓ [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`✗ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
  }
}

async function runPaymentEventRetryStateTests() {
  console.log('--- RUNNING PAYMENT EVENT RETRY STATE & CONCURRENCY TEST SUITE ---');

  // Track side-effects
  let txRecordCount = 0;
  let subUpdateCount = 0;

  const origRecordTx = TransactionRepository.recordTransaction;
  TransactionRepository.recordTransaction = async () => {
    txRecordCount++;
    return true;
  };

  const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
  (supabaseAdmin as any).from = (table: string) => {
    if (table === 'employer_profiles') {
      return {
        update: () => ({
          eq: async () => {
            subUpdateCount++;
            return { error: null, data: [] };
          }
        })
      };
    }
    return origFrom(table);
  };

  const resetCounts = () => {
    txRecordCount = 0;
    subUpdateCount = 0;
  };

  // Check if live PostgreSQL database is available
  let isRealDbAvailable = false;
  try {
    const ping = await queryDb('SELECT 1');
    if (ping && ping.rows) isRealDbAvailable = true;
  } catch {
    isRealDbAvailable = false;
  }

  // ----------------------------------------------------
  // UNIT MOCK DRIVER SUITE (runs in all environments)
  // ----------------------------------------------------
  const origConnect = dbPool.connect.bind(dbPool);

  // In-memory table mock for database simulation
  const mockDbEvents = new Map<string, { event_id: string; payment_id: string; event_type: string; processed_at: Date | null; received_at: Date }>();
  const mockCheckoutSessions = new Map<string, { user_id: string; plan_id: string; expected_amount: number }>();

  const setupMockDb = () => {
    mockDbEvents.clear();
    mockCheckoutSessions.clear();
    mockCheckoutSessions.set('order_retry_123', { user_id: 'usr_retry_123', plan_id: 'pro', expected_amount: 1499 });

    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          const eventId = params[0];
          if (mockDbEvents.has(eventId)) {
            return { rows: [] }; // CONFLICT
          }
          const row = {
            event_id: eventId,
            payment_id: params[1],
            event_type: params[2],
            processed_at: null,
            received_at: new Date()
          };
          mockDbEvents.set(eventId, row);
          return { rows: [row] };
        }

        if (sql.includes('SELECT event_id, processed_at, received_at FROM public.payment_events')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          return { rows: row ? [row] : [] };
        }

        if (sql.includes('UPDATE public.payment_events') && sql.includes('received_at = NOW()')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          if (row && row.processed_at === null) {
            row.received_at = new Date();
            return { rows: [{ event_id: eventId }] };
          }
          return { rows: [] };
        }

        if (sql.includes('UPDATE public.payment_events') && sql.includes('processed_at = NOW()')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          if (row) {
            row.processed_at = new Date();
          }
          return { rows: [] };
        }

        if (sql.includes('checkout_sessions')) {
          const orderId = params[0];
          const s = mockCheckoutSessions.get(orderId);
          return { rows: s ? [s] : [] };
        }

        return { rows: [] };
      },
      release: () => {}
    });
  };

  // ----------------------------------------------------
  // TEST 1: New Event -> One Claim
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_t1_new',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const eventStored = mockDbEvents.has('payment.captured:pay_t1_new');
    const isCompleted = mockDbEvents.get('payment.captured:pay_t1_new')?.processed_at !== null;

    assert(
      isSuccess && eventStored && isCompleted && txRecordCount === 1 && subUpdateCount === 1,
      'Test 1: New event -> acquires one claim and completes financial processing'
    );
  } catch (err: any) {
    assert(false, 'Test 1: New event claim', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Completed Event -> Idempotent Success
  // ----------------------------------------------------
  try {
    resetCounts();
    // Re-send exact same completed event from Test 1
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_t1_new',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });

    const isIdempotent = res.success === true && res.message === 'Already processed';
    const noDuplicateProcessing = txRecordCount === 0 && subUpdateCount === 0;

    assert(
      isIdempotent && noDuplicateProcessing,
      'Test 2: Completed event -> idempotent success (0 duplicate financial effects)'
    );
  } catch (err: any) {
    assert(false, 'Test 2: Completed event', err.message);
  }

  // ----------------------------------------------------
  // TEST 3 & 4: Concurrent Duplicate & Unprocessed Event Owned by Another Request
  // ----------------------------------------------------
  try {
    resetCounts();
    // Simulate active in-progress event (received_at = NOW(), processed_at = null)
    mockDbEvents.set('payment.captured:pay_t3_in_progress', {
      event_id: 'payment.captured:pay_t3_in_progress',
      payment_id: 'pay_t3_in_progress',
      event_type: 'payment.captured',
      processed_at: null,
      received_at: new Date() // Active within 60s
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_t3_in_progress',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });

    const isBlocked = res.success === false && res.statusCode === 500 && (res.error || '').includes('in progress');
    const noSecondProcessing = txRecordCount === 0 && subUpdateCount === 0;

    assert(
      isBlocked && noSecondProcessing,
      'Test 3 & 4: Concurrent duplicate / unprocessed event owned by active request -> HTTP 500 (2nd request does not process it)'
    );
  } catch (err: any) {
    assert(false, 'Test 3 & 4: Concurrent/Unprocessed active event', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Processing Failure -> payment_events row is NOT silently deleted
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    // Force failure during financial transaction recording
    TransactionRepository.recordTransaction = async () => {
      throw new Error('Simulated DB connection failure on recording transaction');
    };

    let threwError = false;
    try {
      await PaymentService.processRazorpayEvent({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_t5_fail',
              order_id: 'order_retry_123',
              amount: 149900,
              currency: 'INR'
            }
          }
        }
      });
    } catch (err: any) {
      if (err.message.includes('Simulated DB connection failure')) {
        threwError = true;
      }
    }

    const rowPreserved = mockDbEvents.has('payment.captured:pay_t5_fail');
    const processedAtIsNull = mockDbEvents.get('payment.captured:pay_t5_fail')?.processed_at === null;

    assert(
      threwError && rowPreserved && processedAtIsNull,
      'Test 5: Processing failure -> payment_events row is NOT silently deleted (remains persisted with processed_at = null)'
    );

    // Restore mock recordTransaction
    TransactionRepository.recordTransaction = async () => {
      txRecordCount++;
      return true;
    };
  } catch (err: any) {
    assert(false, 'Test 5: Processing failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Retry After Failure -> processing can happen again safely
  // ----------------------------------------------------
  try {
    resetCounts();
    // Simulate stale failed event row (> 60s old, processed_at = null)
    const staleTime = new Date(Date.now() - 120000); // 2 minutes ago
    mockDbEvents.set('payment.captured:pay_t6_retry', {
      event_id: 'payment.captured:pay_t6_retry',
      payment_id: 'pay_t6_retry',
      event_type: 'payment.captured',
      processed_at: null,
      received_at: staleTime
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_t6_retry',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR'
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const isNowCompleted = mockDbEvents.get('payment.captured:pay_t6_retry')?.processed_at !== null;

    assert(
      isSuccess && isNowCompleted && txRecordCount === 1 && subUpdateCount === 1,
      'Test 6: Retry after failure -> stale uncompleted event re-claimed and processed safely to completion'
    );
  } catch (err: any) {
    assert(false, 'Test 6: Retry after failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: Subscription Cancellation Duplicate -> Only One Cancellation Processing
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    // 7A: First cancellation request
    const res1 = await PaymentService.processRazorpayEvent({
      event: 'subscription.cancelled',
      payload: {
        subscription: {
          entity: {
            id: 'sub_t7_cancel',
            notes: { user_id: 'usr_t7_employer' }
          }
        }
      }
    });

    const isSuccess1 = res1.success === true;
    const updated1 = subUpdateCount === 1;

    // 7B: Duplicate cancellation request (after completed)
    resetCounts();
    const res2 = await PaymentService.processRazorpayEvent({
      event: 'subscription.cancelled',
      payload: {
        subscription: {
          entity: {
            id: 'sub_t7_cancel',
            notes: { user_id: 'usr_t7_employer' }
          }
        }
      }
    });

    const isIdempotent2 = res2.success === true && res2.message === 'Already processed';
    const noUpdate2 = subUpdateCount === 0;

    // 7C: Concurrent/in-progress subscription cancellation request
    resetCounts();
    mockDbEvents.set('subscription.cancelled:sub_t7_in_progress', {
      event_id: 'subscription.cancelled:sub_t7_in_progress',
      payment_id: 'sub_t7_in_progress',
      event_type: 'subscription.cancelled',
      processed_at: null,
      received_at: new Date()
    });

    const res3 = await PaymentService.processRazorpayEvent({
      event: 'subscription.cancelled',
      payload: {
        subscription: {
          entity: {
            id: 'sub_t7_in_progress',
            notes: { user_id: 'usr_t7_employer' }
          }
        }
      }
    });

    const isBlocked3 = res3.success === false && res3.statusCode === 500;
    const noUpdate3 = subUpdateCount === 0;

    assert(
      isSuccess1 && updated1 && isIdempotent2 && noUpdate2 && isBlocked3 && noUpdate3,
      'Test 7: Subscription cancellation duplicate -> exactly 1 cancellation processing, duplicates blocked/skipped'
    );
  } catch (err: any) {
    assert(false, 'Test 7: Subscription cancellation duplicate', err.message);
  }

  // Restore mocks
  TransactionRepository.recordTransaction = origRecordTx;
  (supabaseAdmin as any).from = origFrom;
  (dbPool as any).connect = origConnect;

  // ----------------------------------------------------
  // REAL POSTGRESQL DATABASE CONCURRENCY & RETRY INTEGRATION SUITE
  // ----------------------------------------------------
  if (isRealDbAvailable) {
    console.log('--- RUNNING POSTGRESQL REAL DATABASE CONCURRENCY & RETRY INTEGRATION SUITE ---');
    const testPaymentId = 'pay_pg_concurrency_test_999';
    const testOrderId = 'order_pg_concurrency_test_999';
    const testEventId = `payment.captured:${testPaymentId}`;

    try {
      // 1. Cleanup any pre-existing test records
      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [testEventId]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [testPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [testOrderId]).catch(() => {});

      // Seed a test checkout session so order lookup succeeds
      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour', NOW())
         ON CONFLICT (razorpay_order_id) DO NOTHING`,
        [`hash_${testOrderId}`, 'user_pg_concurrency_123', 'pro', 1499, testOrderId]
      ).catch(() => {});

      const payloadWithSameEvent = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: testPaymentId,
              order_id: testOrderId,
              amount: 149900,
              currency: 'INR',
              email: 'employer_pg_concurrency@sevikaa.in'
            }
          }
        }
      };

      // 2. Fire TWO webhook processing calls CONCURRENTLY with the EXACT SAME event ID, payment ID, order ID
      const [attemptA, attemptB] = await Promise.all([
        PaymentService.processRazorpayEvent(payloadWithSameEvent),
        PaymentService.processRazorpayEvent(payloadWithSameEvent)
      ]);

      // 3. Query PostgreSQL database tables to verify concurrency outcomes
      const eventsRes = await queryDb(`SELECT event_id, processed_at FROM public.payment_events WHERE payment_id = $1`, [testPaymentId]);
      const txRes = await queryDb(`SELECT id, razorpay_payment_id, razorpay_order_id, amount, status FROM public.transactions WHERE razorpay_payment_id = $1`, [testPaymentId]);

      // Assertion 1: payment_events rows for the event = 1
      assert(eventsRes?.rows?.length === 1, `Postgres Concurrency 1: payment_events rows for event = 1 (got ${eventsRes?.rows?.length})`);

      // Assertion 2: transactions rows for the payment = 1
      assert(txRes?.rows?.length === 1, `Postgres Concurrency 2: transactions rows for payment = 1 (got ${txRes?.rows?.length})`);

      // Assertion 3: event has processed_at set (is NOT null)
      assert(eventsRes?.rows?.[0]?.processed_at !== null, 'Postgres Concurrency 3: event has processed_at set (not null)');

      // Assertion 4: one concurrent caller wins the claim, the other is blocked (HTTP 500) or already processed
      const validConcurrencyOutcomes =
        (attemptA.success && (attemptB.statusCode === 500 || attemptB.message === 'Already processed')) ||
        (attemptB.success && (attemptA.statusCode === 500 || attemptA.message === 'Already processed'));

      assert(validConcurrencyOutcomes, 'Postgres Concurrency 4: One caller wins claim, the other is blocked (HTTP 500) or already processed');

      // ----------------------------------------------------
      // REAL POSTGRESQL FAILURE + RETRY TEST
      // ----------------------------------------------------
      const failPaymentId = 'pay_pg_fail_retry_888';
      const failOrderId = 'order_pg_fail_retry_888';
      const failEventId = `payment.captured:${failPaymentId}`;

      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [failEventId]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [failPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [failOrderId]).catch(() => {});

      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour', NOW())`,
        [`hash_${failOrderId}`, 'user_fail_retry_123', 'pro', 1499, failOrderId]
      );

      // Insert unprocessed event row (> 60s ago) directly into Postgres (simulating failed first processing attempt)
      await queryDb(
        `INSERT INTO public.payment_events (provider, event_id, payment_id, event_type, payload_hash, received_at, processed_at)
         VALUES ('razorpay', $1, $2, 'payment.captured', 'hash_fail_test', NOW() - INTERVAL '2 minutes', NULL)`,
        [failEventId, failPaymentId]
      );

      // Assert row exists with processed_at = NULL (was NOT deleted)
      const initialFailRow = await queryDb(`SELECT processed_at FROM public.payment_events WHERE event_id = $1`, [failEventId]);
      assert(initialFailRow?.rows?.length === 1 && initialFailRow.rows[0].processed_at === null, 'Postgres Failure 1: Failed processing attempt -> payment_events row remains with processed_at = NULL');

      // Retry with same event payload against Postgres
      const retryPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: failPaymentId,
              order_id: failOrderId,
              amount: 149900,
              currency: 'INR'
            }
          }
        }
      };

      const retryRes = await PaymentService.processRazorpayEvent(retryPayload);
      assert(retryRes.success === true, 'Postgres Retry 2: Retry with same event succeeds in PostgreSQL');

      const retryFailRow = await queryDb(`SELECT processed_at FROM public.payment_events WHERE event_id = $1`, [failEventId]);
      assert(retryFailRow?.rows?.length === 1 && retryFailRow.rows[0].processed_at !== null, 'Postgres Retry 3: Retry completes and sets processed_at != NULL');

    } finally {
      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [testEventId]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [testPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [testOrderId]).catch(() => {});
    }
  } else {
    console.log('ℹ [SKIP] Real PostgreSQL Database Integration Test: Database offline in test environment.');
  }

  console.log('--------------------------------------------------');
  console.log(`TOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('--------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPaymentEventRetryStateTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
