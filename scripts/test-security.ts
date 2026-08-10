import { NextRequest } from 'next/server';
import { GET as getEnquiries, PATCH as patchEnquiries } from '../src/app/api/admin/enquiries/route';
import { POST as uploadAsset } from '../src/app/api/admin/worker/upload-asset/route';
import { GET as getSuperAdmins, POST as postSuperAdmins } from '../src/app/api/super-admin/admins/route';
import { POST as signUpload } from '../src/app/api/upload/sign/route';
import { GET as signCloudinary } from '../src/app/api/upload/cloudinary/sign/route';
import { POST as triggerNotification } from '../src/app/api/notifications/trigger/route';
import { POST as razorpayWebhook } from '../src/app/api/webhooks/razorpay/route';
import { GET as getMatch } from '../src/app/api/match/route';
import { GET as getSocietiesWorkers } from '../src/app/api/societies/workers/route';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getInternalHealth } from '../src/app/api/internal/health/route';

// Set default test environment variables for local security assertion runner
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_live_test_secret_key_99999';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';

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

  // Test 4: Unauthenticated POST /api/upload/sign -> 401
  await assertTest('Upload URL Signer (/api/upload/sign) blocks unauthenticated POST with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/upload/sign', { method: 'POST' });
    const res = await signUpload(req);
    return res.status === 401;
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

  // Test 8: Candidate Match Boolean Aadhaar Verification -> Boolean check
  await assertTest('Candidate Match API (/api/match) correctly returns Boolean is_aadhaar_verified', async () => {
    const req = new NextRequest('http://localhost:3000/api/match?societyId=soc_test');
    const res = await getMatch(req);
    if (res.status !== 200) return false;
    const body = await res.json();
    if (!Array.isArray(body.results)) return false;
    // Ensure all items return boolean is_aadhaar_verified
    return body.results.every((item: any) => typeof item.is_aadhaar_verified === 'boolean');
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

  // Test 10: Health Endpoint -> Returns 200/503 status
  await assertTest('Health Monitoring Endpoint (/api/health) returns structured health status', async () => {
    const res = await getHealth();
    const body = await res.json();

    const dummyReq = new NextRequest('http://localhost:3000/api/internal/health');
    const internalRes = await getInternalHealth(dummyReq);
    const internalBody = await internalRes.json();

    return res.status === 200 && body.status === 'ok' && !!internalBody.checks;
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
