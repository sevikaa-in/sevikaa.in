process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'sevikaa_jwt_secret_key_32_characters_long_minimum';

import { sanitizeAuditText, sanitizeAuditPayload } from '../src/lib/auditLogger';

async function runPrivacyAuditTests() {
  console.log('====================================================');
  console.log('🛡️ SEVIKAA PRIVACY HARDENING — AUDIT SANITIZATION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failedCount++;
    }
  }

  // TEST 1: Phone numbers in changes_summary are contextually transformed or redacted
  const phoneText1 = "Worker phone changed to +919876543210";
  const sanitizedPhoneText1 = sanitizeAuditText(phoneText1);
  assert('Phone number in changes_summary is contextually transformed', 
    !sanitizedPhoneText1.includes('+919876543210') && sanitizedPhoneText1.toLowerCase().includes('contact information updated'));

  const phoneText2 = "Candidate phone number (+919876543210) verified";
  const sanitizedPhoneText2 = sanitizeAuditText(phoneText2);
  assert('Standalone phone number in changes_summary is redacted', 
    !sanitizedPhoneText2.includes('+919876543210') && !sanitizedPhoneText2.includes('9876543210'));

  // TEST 2: Salary in changes_summary is contextually transformed or redacted
  const salaryText1 = "Expected salary changed to ₹25000";
  const sanitizedSalaryText1 = sanitizeAuditText(salaryText1);
  assert('Expected salary in changes_summary is contextually transformed', 
    !sanitizedSalaryText1.includes('25000') && sanitizedSalaryText1.toLowerCase().includes('expected salary updated'));

  const salaryText2 = "Candidate expected_salary: ₹15000";
  const sanitizedSalaryText2 = sanitizeAuditText(salaryText2);
  assert('Standalone salary in changes_summary is redacted', 
    !sanitizedSalaryText2.includes('15000'));

  // TEST 3: Aadhaar numbers in changes_summary & details are redacted
  const aadhaarText = "Aadhaar number 1234 5678 9012 submitted for verification";
  const sanitizedAadhaarText = sanitizeAuditText(aadhaarText);
  assert('Aadhaar number in changes_summary is redacted', 
    !sanitizedAadhaarText.includes('1234 5678 9012') && !sanitizedAadhaarText.includes('123456789012'));

  // TEST 4: Document and Selfie URLs are redacted
  const urlText = "Selfie uploaded to https://cloudinary.com/v1_1/sevikaa/image/upload/v123456/selfie.jpg";
  const sanitizedUrlText = sanitizeAuditText(urlText);
  assert('Document and Selfie URLs in changes_summary are redacted', 
    !sanitizedUrlText.includes('https://') && !sanitizedUrlText.includes('selfie.jpg'));

  // TEST 5: Tokens & OTPs in text & objects are redacted
  const tokenText = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const sanitizedTokenText = sanitizeAuditText(tokenText);
  assert('Bearer JWT tokens in text are redacted', 
    !sanitizedTokenText.includes('eyJhbGci') && sanitizedTokenText.includes('[REDACTED_TOKEN]'));

  // TEST 6: Object payload sanitization preserves safe metadata while redacting sensitive fields
  const payloadObj = {
    action: 'WORKER_ONBOARDING',
    actor_id: 'usr_abc123',
    role: 'worker',
    status: 'pending_review',
    changed_fields: ['full_name', 'gender', 'age', 'expected_salary', 'skills'],
    sensitive_data: {
      phone: '+919876543210',
      aadhaar_front_url: 'https://storage.sevikaa.in/aadhaar_front.png',
      otp: '998877',
      salary: 18000
    }
  };

  const sanitizedObj = sanitizeAuditPayload(payloadObj);

  assert('Object payload preserves action & actor_id & role safe metadata', 
    sanitizedObj.action === 'WORKER_ONBOARDING' && sanitizedObj.actor_id === 'usr_abc123' && sanitizedObj.role === 'worker');

  assert('Object payload preserves changed_fields list', 
    Array.isArray(sanitizedObj.changed_fields) && sanitizedObj.changed_fields.length === 5);

  assert('Object payload redacts nested phone, aadhaar_front_url, otp, and salary', 
    sanitizedObj.sensitive_data.phone === '[REDACTED]' && 
    sanitizedObj.sensitive_data.aadhaar_front_url === '[REDACTED]' &&
    sanitizedObj.sensitive_data.otp === '[REDACTED]' &&
    sanitizedObj.sensitive_data.salary === '[REDACTED]');

  console.log('\n====================================================');
  console.log(`📊 PRIVACY AUDIT TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPrivacyAuditTests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
