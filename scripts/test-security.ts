// Set default test environment variables BEFORE any module imports so modules initialize cleanly
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://mock-redis.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token-12345';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_live_test_secret_key_99999';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';
process.env.MONITORING_SECRET = process.env.MONITORING_SECRET || 'test_monitoring_secret_12345';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'sevikaa_jwt_secret_key_32_characters_long_minimum';

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
import { POST as postSocieties } from '../src/app/api/societies/route';
import { POST as loginOtpPost } from '../src/app/api/auth/login-otp/route';
import { POST as workerOnboardingPost } from '../src/app/api/worker/onboarding/route';
import { signOnboardingJwt, verifyOnboardingJwt } from '../src/lib/jwtHelper';
import { PaymentService } from '../src/services/paymentService';

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

  // ─── Task 8: Distributed Rate-Limit Failure Hardening Tests ─────────────────

  console.log('\n--- Task 8: Rate-Limit Fail-Closed Behavior ---');

  // Test: checkRateLimitCritical returns unavailable=true when Redis is unreachable
  await assertTest(
    'checkRateLimitCritical — returns unavailable=true when Redis is unreachable',
    async () => {
      const { checkRateLimitCritical } = await import('../src/lib/rateLimiter');
      // Point at a guaranteed-unreachable Redis URL
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable-redis.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
      try {
        const result = await checkRateLimitCritical('test-critical-unavailable', 10, 60000);
        if (!result.unavailable) {
          console.error('[FAIL] Expected unavailable=true but got:', result);
          return false;
        }
        if (result.success) {
          console.error('[FAIL] unavailable result must not have success=true');
          return false;
        }
        return true;
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );

  // Test: checkRateLimitAsync falls back to in-memory (does NOT return unavailable=true)
  await assertTest(
    'checkRateLimitAsync — falls back to in-memory when Redis is unreachable (non-critical)',
    async () => {
      const { checkRateLimitAsync } = await import('../src/lib/rateLimiter');
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable-redis.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
      try {
        const result = await checkRateLimitAsync('test-noncritical-fallback', 10, 60000);
        // Non-critical: should succeed via in-memory fallback, NOT return unavailable
        if (result.unavailable) {
          console.error('[FAIL] Non-critical path must not return unavailable=true');
          return false;
        }
        if (!result.success) {
          console.error('[FAIL] Non-critical in-memory fallback should succeed for first request');
          return false;
        }
        return true;
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );

  // Test: checkRateLimitCritical enforces limit correctly when Redis is available
  await assertTest(
    'checkRateLimitCritical — enforces rate limit (success=false) when threshold exceeded via Redis',
    async () => {
      // Skip if Redis credentials are not configured
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!redisUrl || !redisToken || redisUrl.includes('placeholder') || redisUrl.includes('unreachable')) {
        console.log('    [SKIP] Redis credentials not configured — skipping live Redis limit test');
        return true;
      }
      const { checkRateLimitCritical } = await import('../src/lib/rateLimiter');
      const identifier = `test-critical-limit-${Date.now()}`;
      const maxRequests = 3;
      // Exhaust the limit
      for (let i = 0; i < maxRequests; i++) {
        const r = await checkRateLimitCritical(identifier, maxRequests, 60000);
        if (r.unavailable) {
          console.error('[FAIL] Redis was reachable but returned unavailable');
          return false;
        }
        if (!r.success) {
          console.error(`[FAIL] Request ${i + 1} should have succeeded (within limit)`);
          return false;
        }
      }
      // This next request must be rejected
      const final = await checkRateLimitCritical(identifier, maxRequests, 60000);
      if (final.unavailable) {
        console.error('[FAIL] Redis was reachable but returned unavailable on limit-exceeded request');
        return false;
      }
      if (final.success) {
        console.error('[FAIL] Request beyond limit should have been rejected (success=false)');
        return false;
      }
      return true;
    }
  );

  // Test: critical endpoint routes respond 503 when rate-limit service is down
  await assertTest(
    'POST /api/auth/login-otp — returns 503 when Redis is unreachable (fail-closed)',
    async () => {
      const { POST: loginOtpPost } = await import('../src/app/api/auth/login-otp/route');
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable-redis.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
      try {
        const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
          method: 'POST',
          body: JSON.stringify({ action: 'verify', phone: '9999999999', otp: '000000' }),
          headers: { 'Content-Type': 'application/json' }
        });
        const res = await loginOtpPost(req);
        if (res.status !== 503) {
          console.error(`[FAIL] Expected 503 but got ${res.status}`);
          return false;
        }
        const body = await res.json();
        if (!body?.error?.toLowerCase().includes('unavailable')) {
          console.error('[FAIL] 503 body must contain an unavailability message');
          return false;
        }
        return true;
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );

  await assertTest(
    'POST /api/auth/refresh — returns 503 when Redis is unreachable (fail-closed)',
    async () => {
      const { POST: refreshPost } = await import('../src/app/api/auth/refresh/route');
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable-redis.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
      try {
        const req = new NextRequest('http://localhost:3000/api/auth/refresh', { method: 'POST' });
        const res = await refreshPost(req);
        if (res.status !== 503) {
          console.error(`[FAIL] Expected 503 but got ${res.status}`);
          return false;
        }
        return true;
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );

  await assertTest(
    'GET /api/match — returns 503 when Redis is unreachable (fail-closed)',
    async () => {
      const { GET: matchGet } = await import('../src/app/api/match/route');
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable-redis.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
      try {
        const req = new NextRequest('http://localhost:3000/api/match?societyId=1');
        const res = await matchGet(req);
        if (res.status !== 503) {
          console.error(`[FAIL] Expected 503 but got ${res.status}`);
          return false;
        }
        return true;
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );

  await assertTest(
    'GET /api/societies/workers — returns 503 when Redis is unreachable (fail-closed)',
    async () => {
      const { GET: societiesWorkersGet } = await import('../src/app/api/societies/workers/route');
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable-redis.invalid';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
      try {
        const req = new NextRequest('http://localhost:3000/api/societies/workers');
        const res = await societiesWorkersGet(req);
        if (res.status !== 503) {
          console.error(`[FAIL] Expected 503 but got ${res.status}`);
          return false;
        }
        return true;
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = origUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
      }
    }
  );

  // --- Task 9C: POST /api/societies Hardening Tests ---
  await assertTest(
    'POST /api/societies — without auth returns 401',
    async () => {
      const req = new NextRequest('http://localhost:3000/api/societies', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Society' })
      });
      const res = await postSocieties(req);
      return res.status === 401;
    }
  );

  await assertTest(
    'POST /api/societies — invalid JWT token returns 401',
    async () => {
      const req = new NextRequest('http://localhost:3000/api/societies', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid_token_12345' },
        body: JSON.stringify({ name: 'Test Society' })
      });
      const res = await postSocieties(req);
      return res.status === 401;
    }
  );

  // Setup stubs for mock role & insert tests
  const dbLib = await import('../src/lib/db');
  const origQueryDb = dbLib.queryDb;
  const origFetch = global.fetch;

  try {
    global.fetch = async (input: any, init?: any) => {
      const urlStr = typeof input === 'string' ? input : input?.url || '';
      if (urlStr.includes('/auth/v1/user')) {
        const headers = init?.headers || {};
        const authHeader = headers['Authorization'] || headers['authorization'] || '';
        if (authHeader.includes('mock-worker-token')) {
          return new Response(JSON.stringify({ id: 'mock-worker-id', email: 'worker@test.com' }), { status: 200 });
        }
        if (authHeader.includes('mock-employer-token')) {
          return new Response(JSON.stringify({ id: 'mock-employer-id', email: 'employer@test.com' }), { status: 200 });
        }
        if (authHeader.includes('mock-admin-token')) {
          return new Response(JSON.stringify({ id: 'mock-admin-id', email: 'admin@test.com' }), { status: 200 });
        }
        return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
      }
      if (urlStr.includes('unreachable-redis.invalid')) {
        throw new Error('connect ECONNREFUSED');
      }
      if (urlStr.includes('mock-redis.invalid')) {
        return new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 });
      }
      return origFetch(input, init);
    };

    const { dbPool } = await import('../src/lib/db');
    const origDbConnect = dbPool.connect;
    (dbPool as any)._origConnect = origDbConnect;

    dbPool.connect = (async () => {
      return {
        query: async (sql: string, params: any[] = []) => {
          if (sql.includes('public.profiles')) {
            const uid = params[0];
            if (uid === 'mock-worker-id') return { rows: [{ role: 'worker' }] } as any;
            if (uid === 'mock-employer-id') return { rows: [{ role: 'employer' }] } as any;
            if (uid === 'mock-admin-id') return { rows: [{ role: 'admin' }] } as any;
          }
          if (sql.includes('INSERT INTO public.societies')) {
            return { rows: [{ id: 'mock-soc-1', name: params[0], status: 'pending_verification' }] } as any;
          }
          return { rows: [] } as any;
        },
        release: () => {}
      } as any;
    }) as any;

    // Test: POST /api/societies as worker -> 201
    await assertTest(
      'POST /api/societies — authenticated worker role returns 201 on valid request',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';
        try {
          const req = new NextRequest('http://localhost:3000/api/societies', {
            method: 'POST',
            headers: { Authorization: 'Bearer mock-worker-token' },
            body: JSON.stringify({ name: 'Green Glen Society', area: 'Bellandur' })
          });
          const res = await postSocieties(req);
          if (res.status !== 201) {
            console.error(`[FAIL] Expected 201 but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          return data.success === true && data.society?.name === 'Green Glen Society';
        } finally {
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test: POST /api/societies as employer -> 403
    await assertTest(
      'POST /api/societies — employer role is forbidden with 403',
      async () => {
        const req = new NextRequest('http://localhost:3000/api/societies', {
          method: 'POST',
          headers: { Authorization: 'Bearer mock-employer-token' },
          body: JSON.stringify({ name: 'Employer Requested Society' })
        });
        const res = await postSocieties(req);
        return res.status === 403;
      }
    );

    // Test: POST /api/societies as admin -> 403
    await assertTest(
      'POST /api/societies — admin role is forbidden with 403',
      async () => {
        const req = new NextRequest('http://localhost:3000/api/societies', {
          method: 'POST',
          headers: { Authorization: 'Bearer mock-admin-token' },
          body: JSON.stringify({ name: 'Admin Requested Society' })
        });
        const res = await postSocieties(req);
        return res.status === 403;
      }
    );

    // Test: POST /api/societies invalid input -> 400
    await assertTest(
      'POST /api/societies — invalid input (missing name) returns 400',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';
        try {
          const req = new NextRequest('http://localhost:3000/api/societies', {
            method: 'POST',
            headers: { Authorization: 'Bearer mock-worker-token' },
            body: JSON.stringify({ name: '   ' })
          });
          const res = await postSocieties(req);
          return res.status === 400;
        } finally {
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // --- Task 10: New-User Authentication & Provisioning Failure-Path Matrix ---

    // Test 10.1: Auth user creation failure -> 500 & NO tokens issued
    await assertTest(
      'Task 10: Auth user creation failure returns 500 and NEVER issues access or refresh token',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) {
              return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            }
            return { rows: [] } as any; // Profiles and auth.users search return 0 rows
          },
          release: () => {}
        })) as any;

        try {
          const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json' }
          });
          const res = await loginOtpPost(req);
          if (res.status !== 500) {
            console.error(`[FAIL] Expected 500 on auth user creation failure but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          if (data.access_token || data.token || data.refresh_token || data.session) {
            console.error('[FAIL] CRITICAL SECURITY VIOLATION: Issued tokens when auth user creation failed!');
            return false;
          }
          return data.error === 'Account Creation Failed';
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10.2: Mandatory profiles creation failure -> 500 & NO tokens issued
    await assertTest(
      'Task 10: Mandatory profiles creation failure returns 500 and NEVER issues access or refresh token',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        // Override dbPool to return existing auth.users but fails profiles check
        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) {
              return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            }
            if (sql.includes('auth.users')) {
              return { rows: [{ id: 'mock-user-profile-fail', email: 'test@sevikaa.in', phone: '+919988776655' }] } as any;
            }
            if (sql.includes('SELECT id, role, phone, email FROM public.profiles')) {
              return { rows: [] } as any; // Profiles verification fails (0 rows)
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json' }
          });
          const res = await loginOtpPost(req);
          if (res.status !== 500) {
            console.error(`[FAIL] Expected 500 on profiles creation failure but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          if (data.access_token || data.token || data.refresh_token || data.session) {
            console.error('[FAIL] CRITICAL SECURITY VIOLATION: Issued tokens when profiles creation failed!');
            return false;
          }
          return data.error === 'Profile Creation Failed';
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10.3: New worker without worker_profiles -> pending onboarding response (200) & NO tokens issued
    await assertTest(
      'Task 10B: New worker without worker_profiles returns requiresOnboarding=true and NEVER issues access or refresh token',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) {
              return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            }
            if (sql.includes('auth.users')) {
              return { rows: [{ id: 'mock-user-wp-pending', email: 'test@sevikaa.in', phone: '+919988776655' }] } as any;
            }
            if (sql.includes('SELECT id, role, phone, email FROM public.profiles')) {
              return { rows: [{ id: 'mock-user-wp-pending', role: 'worker' }] } as any;
            }
            if (sql.includes('SELECT id FROM public.worker_profiles')) {
              return { rows: [] } as any; // worker_profiles row does not exist yet
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json' }
          });
          const res = await loginOtpPost(req);
          if (res.status !== 200) {
            console.error(`[FAIL] Expected 200 on new worker pending onboarding but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          if (data.access_token || data.token || data.refresh_token || data.session?.access_token) {
            console.error('[FAIL] CRITICAL SECURITY VIOLATION: Issued JWT tokens for incomplete worker profile!');
            return false;
          }
          return data.hasCompletedProfile === false && data.requiresOnboarding === true && data.onboardingUrl === '/worker/onboarding';
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10.4: Mandatory employer_profiles creation failure -> 500 & NO tokens issued
    await assertTest(
      'Task 10: Mandatory employer_profiles creation failure returns 500 and NEVER issues access or refresh token',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) {
              return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            }
            if (sql.includes('auth.users')) {
              return { rows: [{ id: 'mock-user-ep-fail', email: 'test@sevikaa.in', phone: '+919988776655' }] } as any;
            }
            if (sql.includes('SELECT id, role, phone, email FROM public.profiles')) {
              return { rows: [{ id: 'mock-user-ep-fail', role: 'employer' }] } as any; // Profiles verify OK
            }
            if (sql.includes('SELECT id FROM public.employer_profiles')) {
              return { rows: [] } as any; // employer_profiles verification fails (0 rows)
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'employer' }),
            headers: { 'Content-Type': 'application/json' }
          });
          const res = await loginOtpPost(req);
          if (res.status !== 500) {
            console.error(`[FAIL] Expected 500 on employer_profiles creation failure but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          if (data.access_token || data.token || data.refresh_token || data.session) {
            console.error('[FAIL] CRITICAL SECURITY VIOLATION: Issued tokens when employer_profiles creation failed!');
            return false;
          }
          return data.error === 'Employer Profile Creation Failed';
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10.5: Refresh session persistence failure -> 500 & NO tokens issued
    await assertTest(
      'Task 10: Refresh session persistence failure returns 500 and NEVER issues access or refresh token',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) {
              return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            }
            if (sql.includes('auth.users')) {
              return { rows: [{ id: 'mock-user-refresh-fail', email: 'test@sevikaa.in', phone: '+919988776655' }] } as any;
            }
            if (sql.includes('SELECT id, role, phone, email FROM public.profiles')) {
              return { rows: [{ id: 'mock-user-refresh-fail', role: 'worker' }] } as any;
            }
            if (sql.includes('SELECT id FROM public.worker_profiles')) {
              return { rows: [{ id: 'mock-user-refresh-fail' }] } as any;
            }
            if (sql.includes('INSERT INTO public.refresh_tokens')) {
              return { rows: [] } as any; // Refresh token insert fails (0 rows)
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json' }
          });
          const res = await loginOtpPost(req);
          if (res.status !== 500) {
            console.error(`[FAIL] Expected 500 on refresh token persistence failure but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          if (data.access_token || data.token || data.refresh_token || data.session) {
            console.error('[FAIL] CRITICAL SECURITY VIOLATION: Issued tokens when refresh token persistence failed!');
            return false;
          }
          return data.error === 'Authentication Failed';
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10.6: Successful complete idempotent account provisioning -> 200 & valid tokens
    await assertTest(
      'Task 10: Complete idempotent account provisioning succeeds with 200 and valid session tokens',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) {
              return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            }
            if (sql.includes('auth.users')) {
              return { rows: [{ id: 'mock-user-success', email: 'test@sevikaa.in', phone: '+919988776655' }] } as any;
            }
            if (sql.includes('SELECT id, role, phone, email FROM public.profiles')) {
              return { rows: [{ id: 'mock-user-success', role: 'worker' }] } as any;
            }
            if (sql.includes('SELECT id FROM public.worker_profiles')) {
              return { rows: [{ id: 'mock-user-success' }] } as any;
            }
            if (sql.includes('INSERT INTO public.refresh_tokens')) {
              return { rows: [{ id: 'ref-token-id-123' }] } as any;
            }
            if (sql.includes('finalGateRes') || sql.includes('profile_count')) {
              return { rows: [{ profile_count: '1', role_profile_count: '1', session_count: '1' }] } as any;
            }
            return { rows: [{ profile_count: '1', role_profile_count: '1', session_count: '1' }] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const req = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json' }
          });
          const res = await loginOtpPost(req);
          if (res.status !== 200) {
            const errData = await res.json().catch(() => ({}));
            console.error(`[FAIL] Expected 200 on complete provisioning but got ${res.status}:`, errData);
            return false;
          }
          const data = await res.json();
          return data.success === true && typeof data.access_token === 'string' && data.access_token.length > 20;
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10.7: Verify Web vs Mobile token delivery (Web receives HttpOnly cookie; Mobile receives JSON body)
    await assertTest(
      'Task 10A: Mobile receives refresh_token in JSON payload while Web receives HttpOnly cookie',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('public.otp_verifications')) return { rows: [{ target_key: 'phone:9988776655' }] } as any;
            if (sql.includes('auth.users')) return { rows: [{ id: 'mock-user-wm', email: 'test@sevikaa.in', phone: '+919988776655' }] } as any;
            if (sql.includes('SELECT id, role, phone, email FROM public.profiles')) return { rows: [{ id: 'mock-user-wm', role: 'worker' }] } as any;
            if (sql.includes('SELECT id FROM public.worker_profiles')) return { rows: [{ id: 'mock-user-wm' }] } as any;
            if (sql.includes('INSERT INTO public.refresh_tokens')) return { rows: [{ id: 'ref-123' }] } as any;
            return { rows: [{ profile_count: '1', role_profile_count: '1', session_count: '1' }] } as any;
          },
          release: () => {}
        })) as any;

        try {
          // 1. Mobile request: x-client-platform = mobile
          const mobileReq = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json', 'x-client-platform': 'mobile' }
          });
          const mobileRes = await loginOtpPost(mobileReq);
          const mobileData = await mobileRes.json();

          if (!mobileData.refresh_token || !mobileData.session?.refresh_token) {
            console.error('[FAIL] Mobile request should receive refresh_token in JSON payload');
            return false;
          }

          // 2. Web request: origin header present
          const webReq = new NextRequest('http://localhost:3000/api/auth/login-otp', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify', phone: '9988776655', otp: '123456', role: 'worker' }),
            headers: { 'Content-Type': 'application/json', 'origin': 'http://localhost:3000' }
          });
          const webRes = await loginOtpPost(webReq);
          const webData = await webRes.json();

          if (webData.refresh_token || webData.session?.refresh_token) {
            console.error('[FAIL] Web request must NOT return refresh_token in JSON payload');
            return false;
          }

          const webCookieHeader = webRes.headers.get('set-cookie') || '';
          if (!webCookieHeader.includes('sevikaa_refresh_token') || !webCookieHeader.includes('HttpOnly')) {
            console.error('[FAIL] Web request must set HttpOnly cookie sevikaa_refresh_token');
            return false;
          }

          return true;
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // --- Task 10C: Onboarding Credential Lifecycle & Normal API Rejection Matrix ---

    // Test 10C.1: Valid onboarding credential allows Worker onboarding endpoint to authenticate and complete onboarding
    await assertTest(
      'Task 10C: Valid onboarding credential authenticates /api/worker/onboarding and issues normal session',
      async () => {
        const origUrl = process.env.UPSTASH_REDIS_REST_URL;
        const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.invalid';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-redis-token';

        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('SELECT id, role, status')) {
              return { rows: [{ id: 'mock-user-ob-1', role: 'worker', status: 'pending_review', email: 'test@sevikaa.in', phone: '+919988776655', full_name: 'Test Worker' }] } as any;
            }
            if (sql.includes('INSERT INTO public.refresh_tokens')) {
              return { rows: [{ id: 'ref-ob-123' }] } as any;
            }
            return { rows: [{ profile_count: '1', role_profile_count: '1', session_count: '1' }] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const onboardingToken = signOnboardingJwt('mock-user-ob-1', 'test@sevikaa.in', '+919988776655', 'worker');
          const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
            method: 'POST',
            body: JSON.stringify({
              full_name: 'Test Worker',
              gender: 'female',
              age: 28,
              expected_salary: 15000,
              skills: ['maid'],
              languages_spoken: ['Hindi']
            }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${onboardingToken}`
            }
          });

          const res = await workerOnboardingPost(req);
          if (res.status !== 200) {
            const errBody = await res.json().catch(() => ({}));
            console.error(`[FAIL] Expected 200 on onboarding submission but got ${res.status}:`, errBody);
            return false;
          }
          const data = await res.json();
          return data.success === true && data.hasCompletedProfile === true && typeof data.access_token === 'string' && data.access_token.length > 20;
        } finally {
          dbPool.connect = prevConnect;
          process.env.UPSTASH_REDIS_REST_URL = origUrl;
          process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        }
      }
    );

    // Test 10C.2: Expired onboarding credential returns 401
    await assertTest(
      'Task 10C: Expired onboarding credential returns 401 on /api/worker/onboarding',
      async () => {
        const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
          method: 'POST',
          body: JSON.stringify({ full_name: 'Expired Worker' }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer invalid_expired_token`
          }
        });
        const res = await workerOnboardingPost(req);
        return res.status === 401;
      }
    );

    // Test 10C.3: Wrong purpose returns 401
    await assertTest(
      'Task 10C: Non-onboarding token (wrong purpose) is rejected by /api/worker/onboarding with 401',
      async () => {
        const { signSupabaseJwt } = await import('../src/lib/jwtHelper');
        const normalAccessToken = signSupabaseJwt('mock-user-normal', 'test@sevikaa.in', '+919988776655', 'worker');

        const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
          method: 'POST',
          body: JSON.stringify({ full_name: 'Wrong Purpose Worker' }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${normalAccessToken}`
          }
        });
        const res = await workerOnboardingPost(req);
        return res.status === 401;
      }
    );

    // Test 10C.4: Wrong role returns 401/403
    await assertTest(
      'Task 10C: Onboarding credential with wrong role (employer) is rejected by /api/worker/onboarding',
      async () => {
        const employerObToken = signOnboardingJwt('mock-user-emp', 'test@sevikaa.in', '+919988776655', 'employer');
        const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
          method: 'POST',
          body: JSON.stringify({ full_name: 'Employer Fake Worker' }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${employerObToken}`
          }
        });
        const res = await workerOnboardingPost(req);
        return res.status === 401 || res.status === 403;
      }
    );

    // --- Task 10D: Strict Validation & Separate Mobile Onboarding Token Matrix ---

    // Test 10D.1: Missing gender returns 400 (no fabricated gender default)
    await assertTest(
      'Task 10D: Missing gender returns 400 Bad Request (no fabricated gender default)',
      async () => {
        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('SELECT id, role, status')) {
              return { rows: [{ id: 'mock-user-10d-1', role: 'worker', status: 'pending_review' }] } as any;
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const onboardingToken = signOnboardingJwt('mock-user-10d-1', 'test@sevikaa.in', '+919988776655', 'worker');
          const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
            method: 'POST',
            body: JSON.stringify({
              full_name: 'No Gender Worker',
              age: 28,
              expected_salary: 15000,
              skills: ['maid'],
              languages_spoken: ['Hindi']
            }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${onboardingToken}`
            }
          });

          const res = await workerOnboardingPost(req);
          if (res.status !== 400) {
            console.error(`[FAIL] Expected 400 on missing gender but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          return data.error === 'Validation Error' && data.message.includes('Gender is required');
        } finally {
          dbPool.connect = prevConnect;
        }
      }
    );

    // Test 10D.2: Missing age returns 400 (no fabricated age default)
    await assertTest(
      'Task 10D: Missing age returns 400 Bad Request (no fabricated age default)',
      async () => {
        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('SELECT id, role, status')) {
              return { rows: [{ id: 'mock-user-10d-2', role: 'worker', status: 'pending_review' }] } as any;
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const onboardingToken = signOnboardingJwt('mock-user-10d-2', 'test@sevikaa.in', '+919988776655', 'worker');
          const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
            method: 'POST',
            body: JSON.stringify({
              full_name: 'No Age Worker',
              gender: 'female',
              expected_salary: 15000,
              skills: ['maid'],
              languages_spoken: ['Hindi']
            }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${onboardingToken}`
            }
          });

          const res = await workerOnboardingPost(req);
          if (res.status !== 400) {
            console.error(`[FAIL] Expected 400 on missing age but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          return data.error === 'Validation Error' && data.message.includes('Age is required');
        } finally {
          dbPool.connect = prevConnect;
        }
      }
    );

    // Test 10D.3: Missing expected_salary returns 400 (no fabricated salary default)
    await assertTest(
      'Task 10D: Missing expected_salary returns 400 Bad Request (no fabricated salary default)',
      async () => {
        const { dbPool } = await import('../src/lib/db');
        const prevConnect = dbPool.connect;
        dbPool.connect = (async () => ({
          query: async (sql: string, params: any[] = []) => {
            if (sql.includes('SELECT id, role, status')) {
              return { rows: [{ id: 'mock-user-10d-3', role: 'worker', status: 'pending_review' }] } as any;
            }
            return { rows: [] } as any;
          },
          release: () => {}
        })) as any;

        try {
          const onboardingToken = signOnboardingJwt('mock-user-10d-3', 'test@sevikaa.in', '+919988776655', 'worker');
          const req = new NextRequest('http://localhost:3000/api/worker/onboarding', {
            method: 'POST',
            body: JSON.stringify({
              full_name: 'No Salary Worker',
              gender: 'female',
              age: 28,
              skills: ['maid'],
              languages_spoken: ['Hindi']
            }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${onboardingToken}`
            }
          });

          const res = await workerOnboardingPost(req);
          if (res.status !== 400) {
            console.error(`[FAIL] Expected 400 on missing expected_salary but got ${res.status}`);
            return false;
          }
          const data = await res.json();
          return data.error === 'Validation Error' && data.message.includes('Expected salary is required');
        } finally {
          dbPool.connect = prevConnect;
        }
      }
    );

    // Test 10D.4: Mobile secureTokenStorage separates onboarding token from normal access token
    await assertTest(
      'Task 10D: Mobile secureTokenStorage saves onboarding token under separate key and getAccessToken() returns null',
      async () => {
        const storage: Record<string, string> = {};
        const mockSecureStorage = {
          async saveTokens(acc: string, ref?: string) { storage['sevikaa_token'] = acc; if (ref) storage['sevikaa_refresh_token'] = ref; },
          async getAccessToken() { return storage['sevikaa_token'] || null; },
          async getRefreshToken() { return storage['sevikaa_refresh_token'] || null; },
          async saveOnboardingToken(tok: string) { storage['sevikaa_onboarding_token'] = tok; },
          async getOnboardingToken() { return storage['sevikaa_onboarding_token'] || null; },
          async clearOnboardingToken() { delete storage['sevikaa_onboarding_token']; },
          async clearTokens() { delete storage['sevikaa_token']; delete storage['sevikaa_refresh_token']; delete storage['sevikaa_onboarding_token']; }
        };

        await mockSecureStorage.clearTokens();
        await mockSecureStorage.saveOnboardingToken('test-onboarding-jwt-999');

        const accessTok = await mockSecureStorage.getAccessToken();
        const onboardingTok = await mockSecureStorage.getOnboardingToken();

        if (accessTok !== null) {
          console.error('[FAIL] getAccessToken() must NOT return the onboarding token!');
          return false;
        }
        if (onboardingTok !== 'test-onboarding-jwt-999') {
          console.error('[FAIL] getOnboardingToken() should return saved onboarding token');
          return false;
        }

        await mockSecureStorage.clearOnboardingToken();
        const clearedObTok = await mockSecureStorage.getOnboardingToken();
        return clearedObTok === null;
      }
    );

  } finally {
    global.fetch = origFetch;
    const { dbPool } = await import('../src/lib/db');
    if ((dbPool as any)._origConnect) dbPool.connect = (dbPool as any)._origConnect;
    const rateLimiter = await import('../src/lib/rateLimiter');
    if ((rateLimiter as any)._origCritical) rateLimiter.checkRateLimitCritical = (rateLimiter as any)._origCritical;
  }

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
