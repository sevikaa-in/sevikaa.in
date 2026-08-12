import { NextRequest } from 'next/server';
import { GET as getEnquiries, PATCH as patchEnquiries } from '../src/app/api/admin/enquiries/route';
import { POST as uploadAsset } from '../src/app/api/admin/worker/upload-asset/route';
import { GET as getSuperAdmins, POST as postSuperAdmins } from '../src/app/api/super-admin/admins/route';
import { POST as signUpload } from '../src/app/api/upload/sign/route';
import { GET as signCloudinary } from '../src/app/api/upload/cloudinary/sign/route';
import { POST as uploadCloudinary } from '../src/app/api/upload/cloudinary/route';
import { POST as triggerNotification } from '../src/app/api/notifications/trigger/route';
import { GET as getNotificationLogs } from '../src/app/api/notifications/logs/route';
import { POST as sendEmail } from '../src/app/api/notifications/send-email/route';
import { POST as razorpayWebhook } from '../src/app/api/webhooks/razorpay/route';
import { GET as getMatch } from '../src/app/api/match/route';
import { GET as getSocietiesWorkers } from '../src/app/api/societies/workers/route';
import { GET as getEmployerJobs } from '../src/app/api/employer/jobs/route';
import { GET as getWorkerJobs } from '../src/app/api/worker/jobs/route';
import { POST as setRole } from '../src/app/api/auth/set-role/route';
import { POST as pricingPost } from '../src/app/api/pricing/route';
import { POST as reviewsSubmit } from '../src/app/api/reviews/submit/route';
import { GET as reviewsHistory } from '../src/app/api/reviews/history/route';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getInternalHealth } from '../src/app/api/internal/health/route';
import { POST as createOrder } from '../src/app/api/payments/create-order/route';
import { PaymentService } from '../src/services/paymentService';

// Set default test environment variables for local security assertion runner
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_live_test_secret_key_99999';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';
process.env.MONITORING_SECRET = process.env.MONITORING_SECRET || 'test_monitoring_secret_12345';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🔒 SEVIKAA AUTOMATED SECURITY TEST MATRIX RUNNER');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  async function assertTest(name: string, fn: () => Promise<boolean>) {
    try {
      const result = await fn();
      if (result) {
        console.log(`✅ [PASS] ${name}`);
        passedCount++;
      } else {
        console.error(`❌ [FAIL] ${name}`);
        failedCount++;
      }
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name} — Exception: ${err?.message || err}`);
      failedCount++;
    }
  }

  // Test 1: Unauthenticated GET /api/admin/enquiries -> 401
  await assertTest('Admin API (/api/admin/enquiries) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/enquiries');
    const res = await getEnquiries(req);
    return res.status === 401;
  });

  // Test 2: Unauthenticated POST /api/admin/worker/upload-asset -> 401
  await assertTest('Admin Asset Upload (/api/admin/worker/upload-asset) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/worker/upload-asset', { method: 'POST' });
    const res = await uploadAsset(req);
    return res.status === 401;
  });

  // Test 3: Unauthenticated GET /api/super-admin/admins -> 401
  await assertTest('Super-Admin API (/api/super-admin/admins) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/super-admin/admins');
    const res = await getSuperAdmins(req);
    return res.status === 401;
  });

  // Test 4: Deprecated POST /api/upload/sign -> 410
  await assertTest('Upload URL Signer (/api/upload/sign) is deprecated with 410 Gone', async () => {
    const res = await signUpload();
    return res.status === 410;
  });

  // Test 5: Unauthenticated GET /api/upload/cloudinary/sign -> 401
  await assertTest('Cloudinary Document Signer (/api/upload/cloudinary/sign) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/upload/cloudinary/sign?ref=cloudinary:image:sevikaa/aadhaar');
    const res = await signCloudinary(req);
    return res.status === 401;
  });

  // Test 6: Unauthenticated POST /api/notifications/trigger -> 401
  await assertTest('Notification Trigger (/api/notifications/trigger) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications/trigger', { method: 'POST' });
    const res = await triggerNotification(req);
    return res.status === 401;
  });

  // Test 7: Unsigned Razorpay Webhook -> 401
  await assertTest('Razorpay Webhook (/api/webhooks/razorpay) rejects unsigned payload with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      body: JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test' } } } })
    });
    const res = await razorpayWebhook(req);
    return res.status === 401;
  });

  // Test 8: Candidate Match API -> Blocks unauthenticated GET with 401
  await assertTest('Candidate Match API (/api/match) blocks unauthenticated access with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/match?societyId=soc_test');
    const res = await getMatch(req);
    return res.status === 401;
  });

  // Test 9: Public Societies Worker Listing -> Mask PII (phone/email absent)
  await assertTest('Public Workers API (/api/societies/workers) masks private PII fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/societies/workers');
    const res = await getSocietiesWorkers(req);
    if (res.status !== 200) return false;
    const body = await res.json();
    if (!Array.isArray(body.workers)) return false;
    // Verify no worker object exposes phone or email publicly
    return body.workers.every((worker: any) => worker.phone === undefined && worker.email === undefined);
  });

  // Test 10: Health Endpoint -> Returns structured status (200 or 503)
  await assertTest('Health Monitoring Endpoint (/api/health) returns structured health status', async () => {
    const res = await getHealth();
    const body = await res.json();

    const dummyReq = new NextRequest('http://localhost:3000/api/internal/health', {
      headers: { 'x-monitoring-secret': process.env.MONITORING_SECRET || '' }
    });
    const internalRes = await getInternalHealth(dummyReq);
    const internalBody = await internalRes.json();

    return (res.status === 200 || res.status === 503) && !!body.status && (internalRes.status === 200 || internalRes.status === 503);
  });

  // Test 11: Cloudinary Direct Upload -> Blocks unauthenticated
  await assertTest('Direct Cloudinary Upload (/api/upload/cloudinary) blocks unauthenticated POST with 401', async () => {
    const formData = new FormData();
    formData.append('assetType', 'aadhaar_front_url');
    const req = new NextRequest('http://localhost:3000/api/upload/cloudinary', {
      method: 'POST',
      body: formData,
    });
    const res = await uploadCloudinary(req);
    return res.status === 401;
  });

  // Test 12: Notification Logs -> Blocks unauthenticated
  await assertTest('Notification Logs (/api/notifications/logs) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications/logs');
    const res = await getNotificationLogs(req);
    return res.status === 401;
  });

  // Test 13: Send Email -> Blocks unauthenticated
  await assertTest('Send Email (/api/notifications/send-email) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications/send-email', {
      method: 'POST',
      body: JSON.stringify({ type: 'job-posted', toEmail: 'hacker@evil.com', data: {} }),
      headers: { 'content-type': 'application/json' }
    });
    const res = await sendEmail(req);
    return res.status === 401;
  });

  // Test 14: Employer Jobs -> Blocks unauthenticated (no ?userId= bypass)
  await assertTest('Employer Jobs (/api/employer/jobs) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/employer/jobs?userId=arbitrary-user-id');
    const res = await getEmployerJobs(req);
    return res.status === 401;
  });

  // Test 15: Worker Jobs -> Blocks unauthenticated
  await assertTest('Worker Jobs (/api/worker/jobs) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/worker/jobs');
    const res = await getWorkerJobs(req);
    return res.status === 401;
  });

  // Test 16: Set Role -> Blocks unauthenticated POST (IDOR fix)
  await assertTest('Set Role (/api/auth/set-role) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/set-role', {
      method: 'POST',
      body: JSON.stringify({ userId: 'victim-uuid', role: 'employer' }),
      headers: { 'content-type': 'application/json' }
    });
    const res = await setRole(req);
    return res.status === 401;
  });

  // Test 17: Pricing POST -> Blocks unauthenticated
  await assertTest('Pricing POST (/api/pricing) blocks unauthenticated caller with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/pricing', {
      method: 'POST',
      body: JSON.stringify({ settings: { proPlan: { price: '1' } } }),
      headers: { 'content-type': 'application/json' }
    });
    const res = await pricingPost(req);
    return res.status === 401;
  });

  // Test 18: Reviews Submit -> Blocks unauthenticated
  await assertTest('Reviews Submit (/api/reviews/submit) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({ reviewer_id: 'hacker', reviewee_id: 'victim', rating: 5 }),
      headers: { 'content-type': 'application/json' }
    });
    const res = await reviewsSubmit(req);
    return res.status === 401;
  });

  // Test 19: Reviews History -> Blocks unauthenticated IDOR
  await assertTest('Reviews History (/api/reviews/history) blocks unauthenticated GET with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/reviews/history?userId=any-victim-uuid');
    const res = await reviewsHistory(req);
    return res.status === 401;
  });

  // Test 20: Match RPC fail-safe -> Returns empty results, not SELECT *
  await assertTest('/api/match returns empty results (not SELECT * fallback) when societyId missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/match');
    const res = await getMatch(req);
    // Should return 400 (missing societyId) not expose all workers
    return res.status === 400;
  });

  // Test 21: Razorpay missing secret -> Fails closed (not bypass)
  await assertTest('Razorpay signature verification fails closed when secret is empty string', async () => {
    const isValid = PaymentService.verifyRazorpaySignature('payload', 'sig', '');
    return isValid === false; // Must fail closed, not bypass
  });

  // Test 22: Payments create-order -> Blocks unauthenticated POST with 401
  await assertTest('Create Payment Order (/api/payments/create-order) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId: 'standard' }),
      headers: { 'content-type': 'application/json' }
    });
    const res = await createOrder(req);
    return res.status === 401;
  });

  // Test 23: Upload Sign -> Deprecated (returns 410 Gone)
  await assertTest('Upload Signer (/api/upload/sign) is deprecated with 410 Gone', async () => {
    const res = await signUpload();
    return res.status === 410;
  });

  // Test 24: Upload Sign -> Deprecated (returns 410 Gone)
  await assertTest('Upload Signer (/api/upload/sign) returns 410 Gone', async () => {
    const res = await signUpload();
    return res.status === 410;
  });

  // Test 25: Internal Health -> Fails closed with 503 when MONITORING_SECRET missing
  await assertTest('Internal Health (/api/internal/health) fails closed (503) when MONITORING_SECRET is unconfigured', async () => {
    const origSecret = process.env.MONITORING_SECRET;
    delete process.env.MONITORING_SECRET;
    const req = new NextRequest('http://localhost:3000/api/internal/health');
    const res = await getInternalHealth(req);
    process.env.MONITORING_SECRET = origSecret;
    return res.status === 503;
  });

  // Test 26: Employer Workers API (/api/employer/workers) -> Blocks unauthenticated with 401
  await assertTest('Employer Workers API (/api/employer/workers) blocks unauthenticated GET with 401', async () => {
    const { GET: getEmployerWorkers } = await import('../src/app/api/employer/workers/route');
    const req = new NextRequest('http://localhost:3000/api/employer/workers');
    const res = await getEmployerWorkers(req);
    return res.status === 401;
  });

  // Test 27: Refresh Token Endpoint (/api/auth/refresh) -> Blocks missing token with 401
  await assertTest('Refresh Token API (/api/auth/refresh) blocks missing token with 401', async () => {
    const { POST: postRefresh } = await import('../src/app/api/auth/refresh/route');
    const req = new NextRequest('http://localhost:3000/api/auth/refresh', { method: 'POST' });
    const res = await postRefresh(req);
    return res.status === 401;
  });

  // Test 28: Logout Endpoint (/api/auth/logout) -> Responds cleanly with 200
  await assertTest('Logout API (/api/auth/logout) clears session cleanly with 200', async () => {
    const { POST: postLogout } = await import('../src/app/api/auth/logout/route');
    const req = new NextRequest('http://localhost:3000/api/auth/logout', { method: 'POST' });
    const res = await postLogout(req);
    return res.status === 200;
  });

  // Test 29: Logout-All Endpoint (/api/auth/logout-all) -> Responds cleanly with 200
  await assertTest('Logout-All API (/api/auth/logout-all) revokes all user sessions with 200', async () => {
    const { POST: postLogoutAll } = await import('../src/app/api/auth/logout-all/route');
    const req = new NextRequest('http://localhost:3000/api/auth/logout-all', { method: 'POST' });
    const res = await postLogoutAll(req);
    return res.status === 200;
  });

  // Test 30: Database Transaction Helper (withTxDb) -> Is defined and exports transaction function
  await assertTest('Database transaction helper (withTxDb) is exported for atomic row locking', async () => {
    const { withTxDb } = await import('../src/lib/db');
    return typeof withTxDb === 'function';
  });

  // Test 31: Concurrent Refresh Security Test -> FOR UPDATE transaction enforces atomic rotation & reuse revocation
  await assertTest('Concurrent refresh simulation enforces FOR UPDATE single-connection transaction atomicity', async () => {
    const { POST: postRefresh } = await import('../src/app/api/auth/refresh/route');
    const { generateRefreshToken, hashRefreshToken } = await import('../src/lib/jwtHelper');
    const { queryDb } = await import('../src/lib/db');

    // 1. Verify PostgreSQL database availability — MUST FAIL if DB is offline
    try {
      const dbCheck = await queryDb('SELECT 1');
      if (!dbCheck || !dbCheck.rows?.length) {
        throw new Error('PostgreSQL database is offline or unconfigured.');
      }
    } catch (dbErr: any) {
      console.error('❌ [FAIL] Concurrent Refresh Test: PostgreSQL database is UNAVAILABLE:', dbErr?.message);
      return false; // MUST FAIL if DB is unavailable
    }

    const validToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(validToken);
    const mockUserId = '00000000-0000-0000-0000-000000000001';
    const mockFamilyId = '00000000-0000-0000-0000-000000000002';
    const mockSessionId = '00000000-0000-0000-0000-000000000003';

    try {
      // Ensure user profile exists in public.profiles so token rotation lookup succeeds
      await queryDb(
        `INSERT INTO public.profiles (id, email, role, status)
         VALUES ($1, 'test_concurrency@sevikaa.in', 'worker', 'active')
         ON CONFLICT (id) DO UPDATE SET status = 'active'`,
        [mockUserId]
      );

      // Clean up previous test refresh tokens for mockUserId
      await queryDb(`DELETE FROM public.refresh_tokens WHERE user_id = $1`, [mockUserId]);

      // 2. Insert valid unrevoked refresh token with family_id
      await queryDb(
        `INSERT INTO public.refresh_tokens (user_id, token_hash, session_id, family_id, is_revoked, expires_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW() + INTERVAL '7 days')`,
        [mockUserId, tokenHash, mockSessionId, mockFamilyId]
      );

      // 3. Execute 2 CONCURRENT refresh requests with the exact same token
      const [res1, res2] = await Promise.all([
        postRefresh(new NextRequest('http://localhost:3000/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: validToken })
        })),
        postRefresh(new NextRequest('http://localhost:3000/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: validToken })
        }))
      ]);

      // Exactly ONE request must succeed (HTTP 200) and ONE must fail (HTTP 401)
      const successCount = (res1.status === 200 ? 1 : 0) + (res2.status === 200 ? 1 : 0);
      if (successCount !== 1) {
        console.error(`❌ [FAIL] Concurrency violation: successCount was ${successCount} (expected exactly 1)`);
        return false;
      }

      // Extract new rotated refresh token from the successful response
      const successRes = res1.status === 200 ? res1 : res2;
      const successBody = await successRes.json().catch(() => ({}));
      const replacementToken = successBody.refresh_token;

      if (!replacementToken) {
        console.error('❌ [FAIL] Successful rotation response missing new refresh_token');
        return false;
      }

      // 4. Verify Original refresh token is revoked in DB
      const origCheck = await queryDb(
        `SELECT is_revoked FROM public.refresh_tokens WHERE token_hash = $1`,
        [tokenHash]
      );
      if (!origCheck?.rows?.[0]?.is_revoked) {
        console.error('❌ [FAIL] Original refresh token was not marked as revoked in DB');
        return false;
      }

      // 5. Verify exactly ONE unrevoked replacement token exists in family
      const replacementCheck = await queryDb(
        `SELECT token_hash FROM public.refresh_tokens WHERE family_id = $1 AND is_revoked = FALSE`,
        [mockFamilyId]
      );
      if (replacementCheck?.rows?.length !== 1) {
        console.error(`❌ [FAIL] Expected exactly 1 active token in family, found ${replacementCheck?.rows?.length}`);
        return false;
      }

      // 6. Verify replacement token works when refreshed
      const replacementRes = await postRefresh(new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: replacementToken })
      }));
      if (replacementRes.status !== 200) {
        console.error('❌ [FAIL] Replacement token rotation failed with status:', replacementRes.status);
        return false;
      }

      // 7. Verify reusing original token triggers family reuse detection & revokes all tokens
      const reuseRes = await postRefresh(new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: validToken })
      }));
      if (reuseRes.status !== 401) {
        console.error('❌ [FAIL] Reused token request expected 401, got:', reuseRes.status);
        return false;
      }

      // Confirm all family tokens were revoked by family reuse detection
      const familyCheck = await queryDb(
        `SELECT COUNT(*) as active_count FROM public.refresh_tokens WHERE family_id = $1 AND is_revoked = FALSE`,
        [mockFamilyId]
      );
      const activeCount = parseInt(familyCheck?.rows?.[0]?.active_count || '0', 10);
      if (activeCount !== 0) {
        console.error(`❌ [FAIL] Family reuse detection failed to revoke family: active count is ${activeCount}`);
        return false;
      }

      return true;
    } finally {
      // Clean up test session tokens
      await queryDb(`DELETE FROM public.refresh_tokens WHERE user_id = $1`, [mockUserId]).catch(() => {});
      await queryDb(`DELETE FROM public.profiles WHERE id = $1`, [mockUserId]).catch(() => {});
    }
  });

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} tests.`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal Security Test Suite Error:', err);
  process.exit(1);
});
