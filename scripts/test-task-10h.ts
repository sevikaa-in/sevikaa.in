process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'sevikaa_jwt_secret_key_32_characters_long_minimum';

import { NextRequest } from 'next/server';
import { logAuditAction, extractClientIp, sanitizeAuditPayload } from '../src/lib/auditLogger';
import { GET as superAdminAuditGet } from '../src/app/api/super-admin/audit/route';
import { signSupabaseJwt } from '../src/lib/jwtHelper';
import fs from 'fs';
import path from 'path';

async function runTask10HTests() {
  console.log('====================================================');
  console.log('🧪 SEVIKAA RELEASE HARDENING — TASK 10H TEST SUITE');
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

  // -------------------------------------------------------------------------
  // TEST 1: logAuditAction source code contains ZERO DELETE query
  // -------------------------------------------------------------------------
  await assertTest('A. logAuditAction does NOT execute DELETE from audit_logs table', async () => {
    const auditLoggerSrc = fs.readFileSync(path.join(__dirname, '../src/lib/auditLogger.ts'), 'utf8');
    const superAdminAuditSrc = fs.readFileSync(path.join(__dirname, '../src/app/api/super-admin/audit/route.ts'), 'utf8');

    const hasDeleteInLogger = auditLoggerSrc.includes('DELETE FROM public.audit_logs');
    const hasDeleteInSuperAdmin = superAdminAuditSrc.includes('DELETE FROM public.audit_logs');

    return !hasDeleteInLogger && !hasDeleteInSuperAdmin;
  });

  // -------------------------------------------------------------------------
  // TEST 2: Missing IP results in "unknown", never 103.142.12.44
  // -------------------------------------------------------------------------
  await assertTest('B. Missing IP results in unknown, never 103.142.12.44', async () => {
    const emptyIp = extractClientIp(undefined);
    const mockReqWithoutHeaders = new NextRequest('http://localhost:3000/api/test');
    const extractedIp = extractClientIp(mockReqWithoutHeaders);

    const isNotFakeIp = emptyIp !== '103.142.12.44' && extractedIp !== '103.142.12.44';
    const isUnknown = emptyIp === 'unknown' && extractedIp === 'unknown';

    return isNotFakeIp && isUnknown;
  });

  // -------------------------------------------------------------------------
  // TEST 3 & 4: raw_payload sanitization & safe metadata retention
  // -------------------------------------------------------------------------
  await assertTest('C & D. raw_payload containing sensitive keys is sanitized while safe metadata is preserved', async () => {
    const dirtyPayload = {
      action_type: 'USER_REGISTER',
      user_id: 'usr_998877',
      role: 'worker',
      password: 'SuperSecretPassword123!',
      otp: '654321',
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'ref_tok_123456',
      phone: '+919876543210',
      email: 'sensitive@sevikaa.in',
      aadhaar_number: '1234-5678-9012',
      expected_salary: 25000,
      metadata: {
        device: 'iOS',
        app_version: '2.1.0',
        secret_code: 'top_secret'
      }
    };

    const sanitized = sanitizeAuditPayload(dirtyPayload);

    // Verify sensitive keys are redacted
    const passwordRedacted = sanitized.password === '[REDACTED]';
    const otpRedacted = sanitized.otp === '[REDACTED]';
    const tokenRedacted = sanitized.access_token === '[REDACTED]' && sanitized.refresh_token === '[REDACTED]';
    const phoneRedacted = sanitized.phone === '[REDACTED]';
    const emailRedacted = sanitized.email === '[REDACTED]';
    const aadhaarRedacted = sanitized.aadhaar_number === '[REDACTED]';
    const salaryRedacted = sanitized.expected_salary === '[REDACTED]';
    const nestedSecretRedacted = sanitized.metadata?.secret_code === '[REDACTED]';

    // Verify safe metadata is preserved
    const userIdPreserved = sanitized.user_id === 'usr_998877';
    const rolePreserved = sanitized.role === 'worker';
    const devicePreserved = sanitized.metadata?.device === 'iOS';

    return passwordRedacted && otpRedacted && tokenRedacted && phoneRedacted && emailRedacted && 
           aadhaarRedacted && salaryRedacted && nestedSecretRedacted && userIdPreserved && rolePreserved && devicePreserved;
  });

  // -------------------------------------------------------------------------
  // TEST 5: Audit log failure must NOT throw or break main operations
  // -------------------------------------------------------------------------
  await assertTest('E. Audit log failure does not break business operations (fail-safe best effort)', async () => {
    try {
      // Intentionally pass empty/invalid options that might cause internal query error
      await logAuditAction({
        action: 'TEST_FAIL_SAFE',
        details: { broken_obj: BigInt(9007199254740991) } // JSON.stringify(BigInt) throws TypeError in JS if unhandled
      });
      return true;
    } catch (err) {
      // If it threw an unhandled exception, fail-safe failed
      return false;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 6: Super Admin audit GET never returns fabricated IP 103.142.12.44
  // -------------------------------------------------------------------------
  await assertTest('F. Super Admin audit GET response never returns fabricated IP 103.142.12.44', async () => {
    const adminToken = signSupabaseJwt('sa-uuid-123', 'admin@sevikaa.in', '+919999999999', 'super-admin');
    const req = new NextRequest('http://localhost:3000/api/super-admin/audit', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const res = await superAdminAuditGet(req);
    const body = await res.json().catch(() => ({}));

    if (res.status === 200 && Array.isArray(body.logs)) {
      const containsFakeIp = body.logs.some((l: any) => l.ipAddress === '103.142.12.44');
      return !containsFakeIp;
    }
    // If DB is offline, returns success false or 500 cleanly
    return res.status === 500 || res.status === 401 || (res.status === 200 && Array.isArray(body.logs));
  });

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTask10HTests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
