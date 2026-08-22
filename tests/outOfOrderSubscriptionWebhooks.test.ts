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

async function runOutOfOrderSubscriptionTests() {
  console.log('--- RUNNING OUT-OF-ORDER SUBSCRIPTION WEBHOOKS TEST SUITE ---');

  // Check live PostgreSQL database availability before mocking
  let isRealDbAvailable = false;
  try {
    const ping = await queryDb('SELECT 1');
    if (ping && ping.rows) isRealDbAvailable = true;
  } catch {
    isRealDbAvailable = false;
  }

  // Track database state in mock driver
  const mockProfiles = new Map<string, { subscription_status: string; subscription_event_timestamp: number }>();
  const mockCheckoutSessions = new Map<string, { user_id: string; plan_id: string; expected_amount: number }>();
  const mockEvents = new Set<string>();
  const mockTransactions: any[] = [];

  const origRecordTx = TransactionRepository.recordTransaction;
  TransactionRepository.recordTransaction = async (tx: any) => {
    mockTransactions.push(tx);
    return true;
  };

  const origConnect = dbPool.connect.bind(dbPool);
  const setupMockDriver = () => {
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.payment_events')) {
          const eventId = params[0];
          if (mockEvents.has(eventId)) {
            return { rows: [] };
          }
          mockEvents.add(eventId);
          return { rows: [{ event_id: eventId, processed_at: null }] };
        }

        if (sql.includes('SELECT event_id, processed_at, received_at FROM public.payment_events')) {
          const eventId = params[0];
          const exists = mockEvents.has(eventId);
          return { rows: exists ? [{ event_id: eventId, processed_at: new Date(), received_at: new Date() }] : [] };
        }

        if (sql.includes('checkout_sessions')) {
          const orderId = params[0];
          const session = mockCheckoutSessions.get(orderId);
          return { rows: session ? [session] : [] };
        }

        if (sql.includes('UPDATE public.employer_profiles')) {
          const userId = params[0];
          const eventTime = params[1];
          const isPremium = sql.includes("subscription_status = 'premium'");
          const newStatus = isPremium ? 'premium' : 'free';

          const current = mockProfiles.get(userId) || { subscription_status: 'free', subscription_event_timestamp: 0 };
          if (current.subscription_event_timestamp <= eventTime) {
            mockProfiles.set(userId, { subscription_status: newStatus, subscription_event_timestamp: eventTime });
            return { rows: [{ user_id: userId }] };
          }
          return { rows: [] };
        }

        if (sql.includes('SELECT subscription_status, subscription_event_timestamp FROM public.employer_profiles')) {
          const userId = params[0];
          const current = mockProfiles.get(userId);
          return { rows: current ? [current] : [] };
        }

        return { rows: [] };
      },
      release: () => {}
    });
  };

  const resetMockState = () => {
    mockProfiles.clear();
    mockCheckoutSessions.clear();
    mockEvents.clear();
    mockTransactions.length = 0;
  };

  setupMockDriver();

  // ----------------------------------------------------
  // TEST 1: subscription.cancelled (T=200) -> payment.captured (T=100)
  // Expected: subscription remains free/cancelled (older payment.captured rejected)
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_1';
    mockCheckoutSessions.set('order_ooo_1', { user_id: userId, plan_id: 'pro', expected_amount: 1499 });

    // Step 1: Newer cancellation at T=200
    await PaymentService.processRazorpayEvent({
      event: 'subscription.cancelled',
      created_at: 200,
      payload: {
        subscription: {
          entity: { id: 'sub_ooo_1', notes: { user_id: userId }, created_at: 200 }
        }
      }
    });

    const stateAfterCancel = mockProfiles.get(userId);
    assert(stateAfterCancel?.subscription_status === 'free', 'Test 1A: Newer subscription.cancelled (T=200) sets status to free');

    // Step 2: Older payment.captured at T=100
    await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      created_at: 100,
      payload: {
        payment: {
          entity: { id: 'pay_ooo_1', order_id: 'order_ooo_1', amount: 149900, currency: 'INR', created_at: 100 }
        }
      }
    });

    const stateAfterStaleCapture = mockProfiles.get(userId);
    assert(
      stateAfterStaleCapture?.subscription_status === 'free' && stateAfterStaleCapture?.subscription_event_timestamp === 200,
      'Test 1B: Older payment.captured (T=100) DOES NOT overwrite newer cancelled status (T=200)'
    );
  } catch (err: any) {
    assert(false, 'Test 1: Out-of-order payment.captured', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: subscription.cancelled (T=200) -> subscription.charged (T=100)
  // Expected: subscription remains free/cancelled
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_2';

    // Step 1: Newer cancellation at T=200
    await PaymentService.processRazorpayEvent({
      event: 'subscription.cancelled',
      created_at: 200,
      payload: {
        subscription: {
          entity: { id: 'sub_ooo_2', notes: { user_id: userId }, created_at: 200 }
        }
      }
    });

    // Step 2: Older subscription.charged at T=100
    await PaymentService.processRazorpayEvent({
      event: 'subscription.charged',
      created_at: 100,
      payload: {
        payment: {
          entity: { id: 'pay_ooo_2', subscription_id: 'sub_ooo_2', amount: 149900, currency: 'INR', notes: { user_id: userId }, created_at: 100 }
        }
      }
    });

    const stateAfterStaleCharge = mockProfiles.get(userId);
    assert(
      stateAfterStaleCharge?.subscription_status === 'free' && stateAfterStaleCharge?.subscription_event_timestamp === 200,
      'Test 2: Older subscription.charged (T=100) DOES NOT overwrite newer cancelled status (T=200)'
    );
  } catch (err: any) {
    assert(false, 'Test 2: Out-of-order subscription.charged', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: subscription.cancelled (T=200) -> subscription.charged (T=300)
  // Expected: subscription reactivates to premium (newer renewal T=300 > T=200)
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_3';

    // Step 1: Cancellation at T=200
    await PaymentService.processRazorpayEvent({
      event: 'subscription.cancelled',
      created_at: 200,
      payload: {
        subscription: {
          entity: { id: 'sub_ooo_3', notes: { user_id: userId }, created_at: 200 }
        }
      }
    });

    // Step 2: Newer renewal subscription.charged at T=300
    await PaymentService.processRazorpayEvent({
      event: 'subscription.charged',
      created_at: 300,
      payload: {
        payment: {
          entity: { id: 'pay_ooo_3', subscription_id: 'sub_ooo_3', amount: 149900, currency: 'INR', notes: { user_id: userId }, created_at: 300 }
        }
      }
    });

    const stateAfterNewerRenewal = mockProfiles.get(userId);
    assert(
      stateAfterNewerRenewal?.subscription_status === 'premium' && stateAfterNewerRenewal?.subscription_event_timestamp === 300,
      'Test 3: Genuinely newer subscription.charged (T=300 > T=200) reactivates subscription to premium'
    );
  } catch (err: any) {
    assert(false, 'Test 3: Newer renewal event', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Two Concurrent Webhooks with Different Event Timestamps (T=100 vs T=200)
  // Expected: Newer event timestamp wins (T=200)
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_4';
    mockCheckoutSessions.set('order_ooo_4', { user_id: userId, plan_id: 'pro', expected_amount: 1499 });

    const payloadOlder = {
      event: 'payment.captured',
      created_at: 100,
      payload: {
        payment: { entity: { id: 'pay_ooo_4_old', order_id: 'order_ooo_4', amount: 149900, currency: 'INR', created_at: 100 } }
      }
    };

    const payloadNewer = {
      event: 'subscription.cancelled',
      created_at: 200,
      payload: {
        subscription: { entity: { id: 'sub_ooo_4_new', notes: { user_id: userId }, created_at: 200 } }
      }
    };

    await Promise.all([
      PaymentService.processRazorpayEvent(payloadOlder),
      PaymentService.processRazorpayEvent(payloadNewer)
    ]);

    const finalState = mockProfiles.get(userId);
    assert(
      finalState?.subscription_status === 'free' && finalState?.subscription_event_timestamp === 200,
      'Test 4: Concurrent webhooks with T=100 and T=200 -> Newer event timestamp (T=200) wins'
    );
  } catch (err: any) {
    assert(false, 'Test 4: Concurrent timestamp ordering', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Duplicate Webhook with Exact Same Event Timestamp (T=100)
  // Expected: No additional state transition
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_5';
    mockCheckoutSessions.set('order_ooo_5', { user_id: userId, plan_id: 'pro', expected_amount: 1499 });

    const payload = {
      event: 'payment.captured',
      created_at: 100,
      payload: {
        payment: { entity: { id: 'pay_ooo_5', order_id: 'order_ooo_5', amount: 149900, currency: 'INR', created_at: 100 } }
      }
    };

    const res1 = await PaymentService.processRazorpayEvent(payload);
    const res2 = await PaymentService.processRazorpayEvent(payload);

    assert(
      res1.success === true && res2.success === true && res2.message === 'Already processed',
      'Test 5: Duplicate webhook with exact same event timestamp -> skipped idempotently (no additional state transition)'
    );
  } catch (err: any) {
    assert(false, 'Test 5: Duplicate event timestamp', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: payment.captured with missing created_at -> rejected -> transactions table unchanged
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_6';
    mockCheckoutSessions.set('order_ooo_6', { user_id: userId, plan_id: 'pro', expected_amount: 1499 });

    const payloadMissingTs = {
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: 'pay_ooo_6_missing_ts', order_id: 'order_ooo_6', amount: 149900, currency: 'INR' } }
      }
    };

    const res = await PaymentService.processRazorpayEvent(payloadMissingTs);
    assert(
      res.success === false && res.statusCode === 400 && (res.error || '').includes('timestamp') && mockTransactions.length === 0,
      'Test 6: payment.captured with missing created_at -> rejected, ZERO transactions recorded'
    );
  } catch (err: any) {
    assert(false, 'Test 6: Missing timestamp rejection', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: payment.captured with invalid created_at -> rejected -> transactions table unchanged
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_7';
    mockCheckoutSessions.set('order_ooo_7', { user_id: userId, plan_id: 'pro', expected_amount: 1499 });

    const payloadInvalidTs = {
      event: 'payment.captured',
      created_at: -100,
      payload: {
        payment: { entity: { id: 'pay_ooo_7_invalid_ts', order_id: 'order_ooo_7', amount: 149900, currency: 'INR', created_at: -100 } }
      }
    };

    const res = await PaymentService.processRazorpayEvent(payloadInvalidTs);
    assert(
      res.success === false && res.statusCode === 400 && (res.error || '').includes('timestamp') && mockTransactions.length === 0,
      'Test 7: Invalid event timestamp in payload -> rejected with HTTP 400'
    );
  } catch (err: any) {
    assert(false, 'Test 7: Invalid timestamp rejection', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: payment.captured with valid created_at -> transaction recorded & subscription update proceeds
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_8';
    mockCheckoutSessions.set('order_ooo_8', { user_id: userId, plan_id: 'pro', expected_amount: 1499 });

    const payloadValid = {
      event: 'payment.captured',
      created_at: 100,
      payload: {
        payment: { entity: { id: 'pay_ooo_8_valid', order_id: 'order_ooo_8', amount: 149900, currency: 'INR', created_at: 100 } }
      }
    };

    const res = await PaymentService.processRazorpayEvent(payloadValid);
    const profileState = mockProfiles.get(userId);
    assert(
      res.success === true && mockTransactions.length === 1 && profileState?.subscription_status === 'premium',
      'Test 8: payment.captured with valid created_at -> transaction recorded & subscription updated to premium'
    );
  } catch (err: any) {
    assert(false, 'Test 8: Valid timestamp processing', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: subscription.charged with missing timestamp -> no transaction & no subscription update
  // ----------------------------------------------------
  try {
    resetMockState();
    const userId = 'usr_ooo_9';

    const payloadSubMissingTs = {
      event: 'subscription.charged',
      payload: {
        payment: {
          entity: { id: 'pay_ooo_9_sub', subscription_id: 'sub_ooo_9', amount: 149900, currency: 'INR', notes: { user_id: userId } }
        }
      }
    };

    const res = await PaymentService.processRazorpayEvent(payloadSubMissingTs);
    const profileState = mockProfiles.get(userId);
    assert(
      res.success === false && res.statusCode === 400 && mockTransactions.length === 0 && profileState === undefined,
      'Test 9: subscription.charged with missing timestamp -> no transaction & no subscription update'
    );
  } catch (err: any) {
    assert(false, 'Test 9: Subscription charged missing timestamp', err.message);
  }

  // Restore DB pool connect
  TransactionRepository.recordTransaction = origRecordTx;
  (dbPool as any).connect = origConnect;

  // ----------------------------------------------------
  // REAL POSTGRESQL DATABASE CONCURRENCY & OUT-OF-ORDER INTEGRATION TEST
  // ----------------------------------------------------
  if (isRealDbAvailable) {
    console.log('--- RUNNING REAL POSTGRESQL DATABASE OUT-OF-ORDER CONCURRENCY INTEGRATION SUITE ---');

    // -------------------------------------------------------------------
    // PART A: SEQUENTIAL STALE-EVENT REJECTION TEST IN POSTGRESQL
    // -------------------------------------------------------------------
    const pgUserIdSeq = 'usr_pg_ooo_seq_999';
    const pgOrderIdSeq = 'order_pg_ooo_seq_999';
    const pgPayIdSeq = 'pay_pg_ooo_seq_old';
    const pgSubIdSeq = 'sub_pg_ooo_seq_new';
    const pgEventIdSeq1 = `payment.captured:${pgPayIdSeq}`;
    const pgEventIdSeq2 = `subscription.cancelled:${pgSubIdSeq}`;

    try {
      await queryDb(`DELETE FROM public.payment_events WHERE event_id IN ($1, $2)`, [pgEventIdSeq1, pgEventIdSeq2]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [pgPayIdSeq]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [pgOrderIdSeq]).catch(() => {});
      await queryDb(`DELETE FROM public.employer_profiles WHERE user_id = $1`, [pgUserIdSeq]).catch(() => {});

      await queryDb(
        `INSERT INTO public.profiles (id, role, phone) VALUES ($1, 'employer', '+919999988888') ON CONFLICT DO NOTHING`,
        [pgUserIdSeq]
      ).catch(() => {});

      await queryDb(
        `INSERT INTO public.employer_profiles (user_id, name, subscription_status, subscription_event_timestamp)
         VALUES ($1, 'Pg OOO Test Employer', 'free', 0)
         ON CONFLICT (user_id) DO UPDATE SET subscription_status = 'free', subscription_event_timestamp = 0`,
        [pgUserIdSeq]
      );

      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, 'pro', 1499, $3, NOW() + INTERVAL '1 hour', NOW())
         ON CONFLICT (razorpay_order_id) DO NOTHING`,
        [`hash_${pgOrderIdSeq}`, pgUserIdSeq, pgOrderIdSeq]
      );

      // 1. Process newer cancellation first at T=2000000000
      const resCancel = await PaymentService.processRazorpayEvent({
        event: 'subscription.cancelled',
        created_at: 2000000000,
        payload: {
          subscription: { entity: { id: pgSubIdSeq, notes: { user_id: pgUserIdSeq }, created_at: 2000000000 } }
        }
      });
      assert(resCancel.success === true, 'Postgres OOO Test A1: Newer subscription.cancelled (T2) executes in PostgreSQL');

      // 2. Process delayed older payment.captured at T=1000000000
      const resOldCapture = await PaymentService.processRazorpayEvent({
        event: 'payment.captured',
        created_at: 1000000000,
        payload: {
          payment: { entity: { id: pgPayIdSeq, order_id: pgOrderIdSeq, amount: 149900, currency: 'INR', created_at: 1000000000 } }
        }
      });
      assert(resOldCapture.success === true, 'Postgres OOO Test A2: Delayed payment.captured (T1) handled cleanly');

      // 3. Query PostgreSQL employer_profiles to verify subscription_status was NOT overwritten
      const dbProfileRes = await queryDb(
        `SELECT subscription_status, subscription_event_timestamp FROM public.employer_profiles WHERE user_id = $1`,
        [pgUserIdSeq]
      );

      assert(
        dbProfileRes?.rows?.length === 1 &&
        dbProfileRes.rows[0].subscription_status === 'free' &&
        Number(dbProfileRes.rows[0].subscription_event_timestamp) === 2000000000,
        'Postgres OOO Test A3: PostgreSQL database atomically rejected stale T1 update! Status remains free (T2 timestamp retained).'
      );
    } finally {
      await queryDb(`DELETE FROM public.payment_events WHERE event_id IN ($1, $2)`, [pgEventIdSeq1, pgEventIdSeq2]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [pgPayIdSeq]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [pgOrderIdSeq]).catch(() => {});
      await queryDb(`DELETE FROM public.employer_profiles WHERE user_id = $1`, [pgUserIdSeq]).catch(() => {});
    }

    // -------------------------------------------------------------------
    // PART B: TRUE CONCURRENT OUT-OF-ORDER WEBHOOK TEST IN POSTGRESQL
    // -------------------------------------------------------------------
    const pgUserIdConc = 'usr_pg_conc_888';
    const pgOrderIdConc = 'order_pg_conc_888';
    const pgPayIdOlder = 'pay_pg_conc_100_old';
    const pgSubIdNewer = 'sub_pg_conc_200_new';
    const pgEventIdOlder = `payment.captured:${pgPayIdOlder}`;
    const pgEventIdNewer = `subscription.cancelled:${pgSubIdNewer}`;

    try {
      await queryDb(`DELETE FROM public.payment_events WHERE event_id IN ($1, $2)`, [pgEventIdOlder, pgEventIdNewer]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [pgPayIdOlder]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [pgOrderIdConc]).catch(() => {});
      await queryDb(`DELETE FROM public.employer_profiles WHERE user_id = $1`, [pgUserIdConc]).catch(() => {});

      await queryDb(
        `INSERT INTO public.profiles (id, role, phone) VALUES ($1, 'employer', '+919999977777') ON CONFLICT DO NOTHING`,
        [pgUserIdConc]
      ).catch(() => {});

      await queryDb(
        `INSERT INTO public.employer_profiles (user_id, name, subscription_status, subscription_event_timestamp)
         VALUES ($1, 'Pg Concurrent Test Employer', 'free', 0)
         ON CONFLICT (user_id) DO UPDATE SET subscription_status = 'free', subscription_event_timestamp = 0`,
        [pgUserIdConc]
      );

      await queryDb(
        `INSERT INTO public.checkout_sessions (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, 'pro', 1499, $3, NOW() + INTERVAL '1 hour', NOW())
         ON CONFLICT (razorpay_order_id) DO NOTHING`,
        [`hash_${pgOrderIdConc}`, pgUserIdConc, pgOrderIdConc]
      );

      const olderEventPayload = {
        event: 'payment.captured',
        created_at: 100,
        payload: {
          payment: { entity: { id: pgPayIdOlder, order_id: pgOrderIdConc, amount: 149900, currency: 'INR', created_at: 100 } }
        }
      };

      const newerEventPayload = {
        event: 'subscription.cancelled',
        created_at: 200,
        payload: {
          subscription: { entity: { id: pgSubIdNewer, notes: { user_id: pgUserIdConc }, created_at: 200 } }
        }
      };

      // Execute both webhooks truly concurrently targeting the exact same user_id in PostgreSQL
      await Promise.all([
        PaymentService.processRazorpayEvent(olderEventPayload),
        PaymentService.processRazorpayEvent(newerEventPayload)
      ]);

      // Query PostgreSQL employer_profiles to verify final state produced by newer event (T=200)
      const concProfileRes = await queryDb(
        `SELECT subscription_status, subscription_event_timestamp FROM public.employer_profiles WHERE user_id = $1`,
        [pgUserIdConc]
      );

      assert(
        concProfileRes?.rows?.length === 1 &&
        concProfileRes.rows[0].subscription_status === 'free' &&
        Number(concProfileRes.rows[0].subscription_event_timestamp) === 200,
        'Postgres OOO Test B: True Promise.all PostgreSQL concurrency test verified! Final status is free and timestamp is 200 (newer event wins).'
      );
    } finally {
      await queryDb(`DELETE FROM public.payment_events WHERE event_id IN ($1, $2)`, [pgEventIdOlder, pgEventIdNewer]).catch(() => {});
      await queryDb(`DELETE FROM public.transactions WHERE razorpay_payment_id = $1`, [pgPayIdOlder]).catch(() => {});
      await queryDb(`DELETE FROM public.checkout_sessions WHERE razorpay_order_id = $1`, [pgOrderIdConc]).catch(() => {});
      await queryDb(`DELETE FROM public.employer_profiles WHERE user_id = $1`, [pgUserIdConc]).catch(() => {});
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

runOutOfOrderSubscriptionTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
