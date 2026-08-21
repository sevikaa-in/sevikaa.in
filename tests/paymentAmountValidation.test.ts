import { PaymentService } from '../src/services/paymentService';
import { TransactionRepository } from '../src/repositories/transactionRepository';
import { supabaseAdmin } from '../src/lib/supabaseAdminClient';
import { dbPool } from '../src/lib/db';

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

async function runPaymentAmountValidationTests() {
  console.log('--- RUNNING PAYMENT AMOUNT VALIDATION ISOLATED TEST SUITE ---');

  // Track side-effect execution flags
  let transactionRecorded = false;
  let subscriptionUpdated = false;

  // Mock TransactionRepository.recordTransaction
  const origRecordTransaction = TransactionRepository.recordTransaction;
  TransactionRepository.recordTransaction = async (_data: any) => {
    transactionRecorded = true;
    return {} as any;
  };

  // Mock supabaseAdmin.from
  const origFrom = supabaseAdmin.from.bind(supabaseAdmin);
  (supabaseAdmin as any).from = (table: string) => {
    if (table === 'employer_profiles') {
      return {
        update: () => ({
          eq: async () => {
            subscriptionUpdated = true;
            return { error: null, data: [] };
          }
        })
      };
    }
    return origFrom(table);
  };

  // Helper to reset flags before each test
  const resetFlags = () => {
    transactionRecorded = false;
    subscriptionUpdated = false;
  };

  // Setup DB pool mock for database queries
  const origConnect = dbPool.connect.bind(dbPool);

  // ----------------------------------------------------
  // TEST 1: missing payment amount -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test1_missing',
            order_id: 'order_test1_missing',
            currency: 'INR'
            // amount property missing
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Missing payment amount';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 1: Missing payment amount -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 1: Missing payment amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: zero amount -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test2_zero',
            order_id: 'order_test2_zero',
            amount: 0,
            currency: 'INR'
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Invalid payment amount';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 2: Zero payment amount -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 2: Zero amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: negative amount -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test3_neg',
            order_id: 'order_test3_neg',
            amount: -69900,
            currency: 'INR'
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Invalid payment amount';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 3: Negative payment amount -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 3: Negative amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: non-finite amount -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    const resNaN = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test4_nan',
            order_id: 'order_test4_nan',
            amount: NaN,
            currency: 'INR'
          }
        }
      }
    });

    resetFlags();
    const resFloat = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test4_float',
            order_id: 'order_test4_float',
            amount: 69900.75, // non-integer paise
            currency: 'INR'
          }
        }
      }
    });

    const isRejected =
      resNaN.success === false &&
      resNaN.statusCode === 400 &&
      resFloat.success === false &&
      resFloat.statusCode === 400 &&
      (resFloat.error || '').includes('must be an integer');
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 4: Non-finite / non-integer payment amount -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 4: Non-finite amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: missing expected_amount -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_test5' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'user_test5', expected_amount: null }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test5_nullexp',
            order_id: 'order_test5_nullexp',
            amount: 69900,
            currency: 'INR'
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Invalid or missing expected amount in checkout session';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 5: Missing expected_amount in checkout session -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 5: Missing expected_amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: valid amount -> continues
  // ----------------------------------------------------
  try {
    resetFlags();
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_test6' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'user_test6', expected_amount: 699 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test6_valid',
            order_id: 'order_test6_valid',
            amount: 69900, // 699 INR = 69900 paise
            currency: 'INR',
            email: 'employer_test6@sevikaa.in'
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const sideEffectsTriggered = transactionRecorded && subscriptionUpdated;

    assert(
      isSuccess && sideEffectsTriggered,
      'Test 6: Valid amount matching expected_amount -> continues successfully (Transaction & Subscription processed)'
    );
  } catch (err: any) {
    assert(false, 'Test 6: Valid amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: mismatched amount -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_test7' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'user_test7', expected_amount: 699 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test7_mismatch',
            order_id: 'order_test7_mismatch',
            amount: 19900, // 199 paid vs 699 expected
            currency: 'INR'
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Payment amount mismatch';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 7: Mismatched payment amount -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 7: Mismatched amount', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: missing currency -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test8_nocurr',
            order_id: 'order_test8_nocurr',
            amount: 69900
            // currency missing
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Missing currency in payment payload.';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 8: Missing currency -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 8: Missing currency', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: non-INR currency -> rejected
  // ----------------------------------------------------
  try {
    resetFlags();
    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test9_usd',
            order_id: 'order_test9_usd',
            amount: 69900,
            currency: 'USD'
          }
        }
      }
    });

    const isRejected = res.success === false && res.statusCode === 400 && res.error === 'Invalid currency. Expected INR.';
    const noSideEffects = !transactionRecorded && !subscriptionUpdated;

    assert(
      isRejected && noSideEffects,
      'Test 9: Non-INR currency -> rejected with HTTP 400 (NO transaction, NO subscription activation)'
    );
  } catch (err: any) {
    assert(false, 'Test 9: Non-INR currency', err.message);
  }

  // ----------------------------------------------------
  // TEST 10: missing payment method does NOT become UPI
  // ----------------------------------------------------
  try {
    resetFlags();
    let capturedData: any = null;
    TransactionRepository.recordTransaction = async (data: any) => {
      transactionRecorded = true;
      capturedData = data;
      return true;
    };

    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_test10' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'user_test10', expected_amount: 699 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test10_nomethod',
            order_id: 'order_test10_nomethod',
            amount: 69900,
            currency: 'INR'
            // method missing
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const methodIsNull = capturedData && capturedData.payment_method === null;

    assert(
      isSuccess && methodIsNull,
      'Test 10: Missing payment method does NOT become UPI (recorded as null)'
    );
  } catch (err: any) {
    assert(false, 'Test 10: Missing payment method', err.message);
  }

  // ----------------------------------------------------
  // TEST 11: missing billing email does NOT become employer@sevikaa.in
  // ----------------------------------------------------
  try {
    resetFlags();
    let capturedData: any = null;
    TransactionRepository.recordTransaction = async (data: any) => {
      transactionRecorded = true;
      capturedData = data;
      return true;
    };

    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_test11' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'user_test11', expected_amount: 699 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test11_noemail',
            order_id: 'order_test11_noemail',
            amount: 69900,
            currency: 'INR'
            // email missing
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const emailIsNull = capturedData && capturedData.employer_email === null && capturedData.employer_name === null;

    assert(
      isSuccess && emailIsNull,
      'Test 11: Missing billing email does NOT become employer@sevikaa.in (recorded as null)'
    );
  } catch (err: any) {
    assert(false, 'Test 11: Missing billing email', err.message);
  }

  // ----------------------------------------------------
  // TEST 12: missing billing phone does NOT become N/A
  // ----------------------------------------------------
  try {
    resetFlags();
    let capturedData: any = null;
    TransactionRepository.recordTransaction = async (data: any) => {
      transactionRecorded = true;
      capturedData = data;
      return true;
    };

    (dbPool as any).connect = async () => ({
      query: async (sql: string) => {
        if (sql.includes('INSERT INTO public.payment_events')) return { rows: [{ event_id: 'ev_test12' }] };
        if (sql.includes('checkout_sessions')) return { rows: [{ user_id: 'user_test12', expected_amount: 699 }] };
        return { rows: [] };
      },
      release: () => {}
    });

    const res = await PaymentService.processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test12_nophone',
            order_id: 'order_test12_nophone',
            amount: 69900,
            currency: 'INR'
            // contact missing
          }
        }
      }
    });

    const isSuccess = res.success === true;
    const phoneIsNull = capturedData && capturedData.employer_phone === null;

    assert(
      isSuccess && phoneIsNull,
      'Test 12: Missing billing phone does NOT become N/A (recorded as null)'
    );
  } catch (err: any) {
    assert(false, 'Test 12: Missing billing phone', err.message);
  }

  // Restore mocks
  TransactionRepository.recordTransaction = origRecordTransaction;
  (supabaseAdmin as any).from = origFrom;
  (dbPool as any).connect = origConnect;

  console.log('--------------------------------------------------');
  console.log(`TOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('--------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPaymentAmountValidationTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
