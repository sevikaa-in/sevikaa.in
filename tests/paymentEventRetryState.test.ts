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

  let txRecordCount = 0;
  let subUpdateCount = 0;

  const origRecordTransaction = TransactionRepository.recordTransaction;
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
  const mockDbEvents = new Map<string, { event_id: string; payment_id: string; event_type: string; status: string; processed_at: Date | null; received_at: Date }>();
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
            status: 'PENDING',
            processed_at: null,
            received_at: new Date()
          };
          mockDbEvents.set(eventId, row);
          return { rows: [row] };
        }

        if (sql.includes('SELECT event_id, status, processed_at, received_at FROM public.payment_events') || sql.includes('FROM public.payment_events')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          return { rows: row ? [row] : [] };
        }

        if (sql.includes('UPDATE public.payment_events') && sql.includes("status = 'REJECTED'")) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          if (row) {
            row.status = 'REJECTED';
          }
          return { rows: [] };
        }

        if (sql.includes('UPDATE public.payment_events') && sql.includes('received_at = NOW()')) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          if (row && row.status === 'PENDING' && row.processed_at === null) {
            row.received_at = new Date();
            return { rows: [{ event_id: eventId }] };
          }
          return { rows: [] };
        }

        if (sql.includes('UPDATE public.payment_events') && sql.includes("status = 'COMPLETED'")) {
          const eventId = params[0];
          const row = mockDbEvents.get(eventId);
          if (row) {
            row.status = 'COMPLETED';
            row.processed_at = new Date();
          }
          return { rows: [] };
        }

        if (sql.includes('checkout_sessions')) {
          const orderId = params[0];
          const s = mockCheckoutSessions.get(orderId);
          return { rows: s ? [s] : [] };
        }

        if (sql.includes('UPDATE public.employer_profiles')) {
          return { rows: [{ user_id: 'usr_retry_123' }] };
        }

        return { rows: [] };
      },
      release: () => {}
    });
  };

  // ----------------------------------------------------
  // TEST 1: New Event -> One Claim, status = COMPLETED, processed_at != NULL
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_t1_new',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const storedRow = mockDbEvents.get('payment.captured:pay_t1_new');
    const isCompleted = storedRow?.status === 'COMPLETED' && storedRow?.processed_at !== null;

    assert(
      isSuccess && isCompleted && txRecordCount === 1,
      'Test 1: New event -> status = COMPLETED & processed_at != NULL'
    );
  } catch (err: any) {
    assert(false, 'Test 1: New event claim', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Duplicate COMPLETED Event -> No Processing (Already Processed)
  // ----------------------------------------------------
  try {
    resetCounts();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_t1_new',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    const isIdempotent = res.success === true && res.message === 'Already processed';
    const noDuplicateProcessing = txRecordCount === 0 && subUpdateCount === 0;

    assert(
      isIdempotent && noDuplicateProcessing,
      'Test 2: Duplicate COMPLETED event -> idempotent skip (0 duplicate financial effects)'
    );
  } catch (err: any) {
    assert(false, 'Test 2: Duplicate COMPLETED event', err.message);
  }

  // ----------------------------------------------------
  // TEST 3 & 4: Concurrent PENDING Processing -> Only One Processor Wins
  // ----------------------------------------------------
  try {
    resetCounts();
    mockDbEvents.set('payment.captured:pay_t3_in_progress', {
      event_id: 'payment.captured:pay_t3_in_progress',
      payment_id: 'pay_t3_in_progress',
      event_type: 'payment.captured',
      status: 'PENDING',
      processed_at: null,
      received_at: new Date()
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_t3_in_progress',
            order_id: 'order_retry_123',
            amount: 149900,
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    const isBlocked = res.success === false && res.statusCode === 500 && (res.error || '').includes('in progress');
    const noSecondProcessing = txRecordCount === 0 && subUpdateCount === 0;

    assert(
      isBlocked && noSecondProcessing,
      'Test 3 & 4: Concurrent PENDING processing -> HTTP 500 forcing retry (only 1 winner)'
    );
  } catch (err: any) {
    assert(false, 'Test 3 & 4: Concurrent PENDING processing', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Transient DB Failure -> status remains PENDING, event remains retryable
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    TransactionRepository.recordTransaction = async () => {
      throw new Error('Simulated DB connection failure on recording transaction');
    };

    let threwError = false;
    try {
      await PaymentService.processRazorpayEvent({
        event: 'payment.captured',
        created_at: 1787239490,
        payload: {
          payment: {
            entity: {
              id: 'pay_t5_fail',
              order_id: 'order_retry_123',
              amount: 149900,
              currency: 'INR',
              created_at: 1787239490
            }
          }
        }
      });
    } catch (err: any) {
      if (err.message.includes('Simulated DB connection failure')) {
        threwError = true;
      }
    }

    const row = mockDbEvents.get('payment.captured:pay_t5_fail');
    const isPending = row?.status === 'PENDING' && row?.processed_at === null;

    assert(
      threwError && isPending,
      'Test 5: Transient DB failure -> status remains PENDING & processed_at = NULL (retryable)'
    );

    TransactionRepository.recordTransaction = async () => {
      txRecordCount++;
      return true;
    };
  } catch (err: any) {
    assert(false, 'Test 5: Transient failure', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Amount Mismatch -> row remains, status = REJECTED
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();
    mockCheckoutSessions.set('order_mismatch_123', { user_id: 'usr_mismatch', plan_id: 'pro', expected_amount: 1499 });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_amount_mismatch',
            order_id: 'order_mismatch_123',
            amount: 29900, // 299 paid vs 1499 expected
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    const storedRow = mockDbEvents.get('payment.captured:pay_amount_mismatch');
    assert(
      res.success === false && res.statusCode === 400 && storedRow?.status === 'REJECTED' && storedRow?.processed_at === null,
      'Test 6: Amount mismatch -> row remains, status = REJECTED, processed_at = NULL'
    );
  } catch (err: any) {
    assert(false, 'Test 6: Amount mismatch rejection', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: Duplicate REJECTED Event -> No Processing (Already Rejected)
  // ----------------------------------------------------
  try {
    resetCounts();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_amount_mismatch',
            order_id: 'order_mismatch_123',
            amount: 29900,
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    assert(
      res.success === true && res.message === 'Already rejected' && txRecordCount === 0,
      'Test 7: Duplicate REJECTED event -> returns "Already rejected", 0 processing'
    );
  } catch (err: any) {
    assert(false, 'Test 7: Duplicate REJECTED event', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: Unmapped Payment Order -> row remains, status = REJECTED
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_unmapped_order_999',
            order_id: 'order_non_existent',
            amount: 149900,
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    const storedRow = mockDbEvents.get('payment.captured:pay_unmapped_order_999');
    assert(
      res.success === false && res.statusCode === 400 && storedRow?.status === 'REJECTED',
      'Test 8: Unmapped payment order -> row remains, status = REJECTED'
    );
  } catch (err: any) {
    assert(false, 'Test 8: Unmapped payment order', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: Unmapped Subscription -> row remains, status = REJECTED
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();

    const res = await PaymentService.processRazorpayEvent({
      event: 'subscription.charged',
      created_at: 1787239490,
      payload: {
        subscription: {
          entity: {
            id: 'sub_unmapped_123',
            plan_id: 'plan_pro',
            created_at: 1787239490
          }
        },
        payment: {
          entity: {
            id: 'pay_unmapped_sub_123',
            subscription_id: 'sub_unmapped_123',
            amount: 149900,
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    const storedRow = mockDbEvents.get('subscription.charged:pay_unmapped_sub_123');
    assert(
      res.success === false && res.statusCode === 400 && storedRow?.status === 'REJECTED',
      'Test 9: Unmapped subscription -> row remains, status = REJECTED'
    );
  } catch (err: any) {
    assert(false, 'Test 9: Unmapped subscription', err.message);
  }

  // ----------------------------------------------------
  // TEST 10: DB Failure during REJECTED update -> returns HTTP 500 (retryable, NOT reported as permanent 400)
  // ----------------------------------------------------
  try {
    resetCounts();
    setupMockDb();
    mockCheckoutSessions.set('order_db_fail_rej', { user_id: 'usr_db_fail_rej', plan_id: 'pro', expected_amount: 1499 });

    // Override connect to throw DB error when UPDATE status = 'REJECTED' runs
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          const eventId = params[0];
          const row = { event_id: eventId, payment_id: params[1], event_type: params[2], status: 'PENDING', processed_at: null, received_at: new Date() };
          mockDbEvents.set(eventId, row);
          return { rows: [row] };
        }
        if (sql.includes('checkout_sessions')) {
          return { rows: [{ user_id: 'usr_db_fail_rej', plan_id: 'pro', expected_amount: 1499 }] };
        }
        if (sql.includes("status = 'REJECTED'")) {
          throw new Error('Simulated DB failure during REJECTED status write');
        }
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 1787239490,
      payload: {
        payment: {
          entity: {
            id: 'pay_db_fail_rej',
            order_id: 'order_db_fail_rej',
            amount: 29900, // amount mismatch
            currency: 'INR',
            created_at: 1787239490
          }
        }
      }
    });

    assert(
      res.success === false && res.statusCode === 500 && (res.error || '').includes('Database service unavailable'),
      'Test 10: Failure to persist REJECTED is NOT reported as permanent rejection -> returns HTTP 500 (retryable)'
    );
  } catch (err: any) {
    assert(false, 'Test 10: DB failure during REJECTED update', err.message);
  }

  // Restore mocks
  TransactionRepository.recordTransaction = origRecordTransaction;
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
      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [testEventId]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [testPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [testOrderId]).catch(() => {});

      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour', NOW())
         ON CONFLICT (razorpay_order_id) DO NOTHING`,
        [`hash_${testOrderId}`, 'user_pg_concurrency_123', 'pro', 1499, testOrderId]
      ).catch(() => {});

      const payloadWithSameEvent = {
        event: 'payment.captured',
        created_at: 1787239490,
        payload: {
          payment: {
            entity: {
              id: testPaymentId,
              order_id: testOrderId,
              amount: 149900,
              currency: 'INR',
              email: 'employer_pg_concurrency@sevikaa.in',
              created_at: 1787239490
            }
          }
        }
      };

      const [attemptA, attemptB] = await Promise.all([
        PaymentService.processRazorpayEvent(payloadWithSameEvent),
        PaymentService.processRazorpayEvent(payloadWithSameEvent)
      ]);

      const eventsRes = await queryDb(`SELECT event_id, status, processed_at FROM public.payment_events WHERE payment_id = $1`, [testPaymentId]);
      const txRes = await queryDb(`SELECT id, razorpay_payment_id, status FROM public.transactions WHERE razorpay_payment_id = $1`, [testPaymentId]);

      assert(eventsRes?.rows?.length === 1 && eventsRes.rows[0].status === 'COMPLETED', `Postgres Real Test 1: payment_events row exists with status = COMPLETED`);
      assert(txRes?.rows?.length === 1, `Postgres Real Test 2: transactions row created`);

      // Real Postgres Rejection Test (Amount Mismatch)
      const testRejPaymentId = 'pay_pg_rej_999';
      const testRejOrderId = 'order_pg_rej_999';
      const testRejEventId = `payment.captured:${testRejPaymentId}`;

      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [testRejEventId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [testRejOrderId]).catch(() => {});

      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour', NOW())`,
        [`hash_${testRejOrderId}`, 'user_pg_rej_123', 'pro', 1499, testRejOrderId]
      );

      const rejRes = await PaymentService.processRazorpayEvent({
        event: 'payment.captured',
        created_at: 1787239490,
        payload: {
          payment: {
            entity: {
              id: testRejPaymentId,
              order_id: testRejOrderId,
              amount: 29900, // mismatch
              currency: 'INR',
              created_at: 1787239490
            }
          }
        }
      });

      const rejRow = await queryDb(`SELECT status, processed_at FROM public.payment_events WHERE event_id = $1`, [testRejEventId]);
      assert(
        rejRes.success === false && rejRow?.rows?.length === 1 && rejRow.rows[0].status === 'REJECTED' && rejRow.rows[0].processed_at === null,
        'Postgres Real Test 3: Rejection in PostgreSQL -> status = REJECTED, row remains persisted'
      );

      // Real Postgres CHECK Constraint Test
      let checkConstraintTriggered = false;
      try {
        await queryDb(
          `INSERT INTO public.payment_events (provider, event_id, payment_id, event_type, status) VALUES ('razorpay', 'invalid_status_test', 'pay_inv', 'payment.captured', 'INVALID_STATUS')`
        );
      } catch (err: any) {
        if ((err.message || '').includes('chk_payment_events_status') || (err.code || '') === '23514') {
          checkConstraintTriggered = true;
        }
      }
      assert(checkConstraintTriggered, 'Postgres Real Test 4: Invalid status value (INVALID_STATUS) rejected by PostgreSQL CHECK constraint chk_payment_events_status');

    } finally {
      await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [testPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [testPaymentId]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [testOrderId]).catch(() => {});
    }
  } else {
    console.log('SKIPPED — PostgreSQL unavailable');
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
