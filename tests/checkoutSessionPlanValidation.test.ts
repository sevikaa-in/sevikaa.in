const supabaseJs = require('@supabase/supabase-js');
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

// Mock Supabase createClient BEFORE route import
supabaseJs.createClient = () => ({
  auth: {
    getUser: async () => ({
      data: { user: { id: 'usr_test_auth_123' } },
      error: null
    })
  }
});

async function runCheckoutSessionPlanValidationTests() {
  console.log('--- RUNNING CHECKOUT SESSION PLAN VALIDATION TEST SUITE ---');

  // Require route AFTER createClient mock is set
  const { POST } = await import('../src/app/api/auth/checkout-session/route');

  let dbQueryCalled = false;
  let insertedPlanId: string | null = null;
  const origConnect = dbPool.connect.bind(dbPool);

  // Helper mock DB connection
  const mockDb = () => {
    dbQueryCalled = false;
    insertedPlanId = null;
    (dbPool as any).connect = async () => ({
      query: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO public.checkout_sessions')) {
          dbQueryCalled = true;
          insertedPlanId = params[2]; // $3 is plan_id
          return { rows: [] };
        }
        return { rows: [] };
      },
      release: () => {}
    });
  };

  // ----------------------------------------------------
  // TEST 1: missing planId -> 400 (NO DB INSERT)
  // ----------------------------------------------------
  try {
    mockDb();
    const req = new Request('http://localhost/api/auth/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake_token' },
      body: JSON.stringify({}) // missing planId
    });

    const res = await POST(req as any);
    const body = await res.json();
    const isRejected = res.status === 400 && body.error === 'Missing planId';
    const noDbInsert = !dbQueryCalled;

    assert(
      isRejected && noDbInsert,
      'Test 1: Missing planId -> HTTP 400 (NO checkout_sessions row created)'
    );
  } catch (err: any) {
    assert(false, 'Test 1: Missing planId', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: empty planId -> 400 (NO DB INSERT)
  // ----------------------------------------------------
  try {
    mockDb();
    const req = new Request('http://localhost/api/auth/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake_token' },
      body: JSON.stringify({ planId: '   ' }) // whitespace/empty planId
    });

    const res = await POST(req as any);
    const body = await res.json();
    const isRejected = res.status === 400 && body.error === 'Missing planId';
    const noDbInsert = !dbQueryCalled;

    assert(
      isRejected && noDbInsert,
      'Test 2: Empty/whitespace planId -> HTTP 400 (NO checkout_sessions row created)'
    );
  } catch (err: any) {
    assert(false, 'Test 2: Empty planId', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: non-string planId -> 400 (NO DB INSERT)
  // ----------------------------------------------------
  try {
    mockDb();
    const req = new Request('http://localhost/api/auth/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake_token' },
      body: JSON.stringify({ planId: 1499 }) // number instead of string
    });

    const res = await POST(req as any);
    const body = await res.json();
    const isRejected = res.status === 400 && body.error === 'Missing planId';
    const noDbInsert = !dbQueryCalled;

    assert(
      isRejected && noDbInsert,
      'Test 3: Non-string planId -> HTTP 400 (NO checkout_sessions row created)'
    );
  } catch (err: any) {
    assert(false, 'Test 3: Non-string planId', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: valid planId -> HTTP 200 (DB INSERT executed with exact planId)
  // ----------------------------------------------------
  try {
    mockDb();
    const req = new Request('http://localhost/api/auth/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake_token' },
      body: JSON.stringify({ planId: 'pro_pass_1499' }) // valid planId
    });

    const res = await POST(req as any);
    const body = await res.json();
    const isSuccess = res.status === 200 && body.success === true;
    const dbInsertCorrect = dbQueryCalled && insertedPlanId === 'pro_pass_1499';

    assert(
      isSuccess && dbInsertCorrect,
      'Test 4: Valid planId -> HTTP 200 (checkout_sessions row created with exact supplied planId)'
    );
  } catch (err: any) {
    assert(false, 'Test 4: Valid planId', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: valid plan_id (snake_case) -> HTTP 200 (DB INSERT executed)
  // ----------------------------------------------------
  try {
    mockDb();
    const req = new Request('http://localhost/api/auth/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake_token' },
      body: JSON.stringify({ plan_id: 'starter_plan' })
    });

    const res = await POST(req as any);
    const body = await res.json();
    const isSuccess = res.status === 200 && body.success === true;
    const dbInsertCorrect = dbQueryCalled && insertedPlanId === 'starter_plan';

    assert(
      isSuccess && dbInsertCorrect,
      'Test 5: Valid plan_id (snake_case) -> HTTP 200 (checkout_sessions row created with exact supplied planId)'
    );
  } catch (err: any) {
    assert(false, 'Test 5: Valid plan_id', err.message);
  }

  // Restore DB pool
  (dbPool as any).connect = origConnect;

  console.log('--------------------------------------------------');
  console.log(`TOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('--------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runCheckoutSessionPlanValidationTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
