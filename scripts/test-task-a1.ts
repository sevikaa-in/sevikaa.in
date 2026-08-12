process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'sevikaa_jwt_secret_key_32_characters_long_minimum';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'sevikaa';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '1234567890';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'secret_1234567890';

import fs from 'fs';
import path from 'path';
import { POST as deprecatedUploadAssetPOST } from '../src/app/api/admin/worker/upload-asset/route';
import { GET as cloudinarySignGET } from '../src/app/api/upload/cloudinary/sign/route';
import { signSupabaseJwt } from '../src/lib/jwtHelper';
import { queryDb } from '../src/lib/db';
import { NextRequest } from 'next/server';

function generateTestToken(userId: string, email: string, role = 'worker') {
  return signSupabaseJwt(userId, email, '', role);
}

async function runTaskA1Tests() {
  console.log('====================================================');
  console.log('🛡️ SEVIKAA RELEASE BLOCKER — STORAGE SECURITY TASK A1 TESTS');
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

  // TEST 1-4: Migration 20260812000000_storage_hardening.sql contains public = false for all 4 sensitive buckets
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260812000000_storage_hardening.sql');
  const migrationSql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert('1. Migration exists & sets worker-selfies bucket public = false',
    migrationSql.includes("'worker-selfies', 'worker-selfies', false") && migrationSql.includes('UPDATE storage.buckets'));

  assert('2. Migration sets worker-videos bucket public = false',
    migrationSql.includes("'worker-videos', 'worker-videos', false"));

  assert('3. Migration sets worker-documents bucket public = false',
    migrationSql.includes("'worker-documents', 'worker-documents', false"));

  assert('4. Migration sets verification-documents bucket public = false',
    migrationSql.includes("'verification-documents', 'verification-documents', false"));

  // TEST 5: Verify zero getPublicUrl() calls for sensitive buckets across production src/
  function scanDirForGetPublicUrl(dir: string): string[] {
    const results: string[] = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...scanDirForGetPublicUrl(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('getPublicUrl(') && !fullPath.includes('test')) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  const getPublicUrlUsages = scanDirForGetPublicUrl(path.join(process.cwd(), 'src'));
  assert('5. No production code calls getPublicUrl() for sensitive buckets',
    getPublicUrlUsages.length === 0);

  // TEST 6: Deprecated admin upload route returns HTTP 410 Gone
  const dummyReq = new NextRequest('http://localhost:3000/api/admin/worker/upload-asset', { method: 'POST' });
  const depRes = await deprecatedUploadAssetPOST(dummyReq);
  assert('6. Deprecated admin upload route returns HTTP 410 Gone',
    depRes.status === 410);

  // Set up mock DB profiles for authorization testing
  const worker1Id = '11111111-1111-4111-a111-111111111111';
  const worker2Id = '22222222-2222-4222-a222-222222222222';
  const employerId = '33333333-3333-4333-a333-333333333333';
  const adminId = '44444444-4444-4444-a444-444444444444';

  try {
    await queryDb(`
      INSERT INTO public.profiles (id, email, role, status) VALUES
        ($1, 'worker1@sevikaa.in', 'worker', 'live'),
        ($2, 'worker2@sevikaa.in', 'worker', 'live'),
        ($3, 'employer@sevikaa.in', 'employer', 'live'),
        ($4, 'admin@sevikaa.in', 'admin', 'live')
      ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    `, [worker1Id, worker2Id, employerId, adminId]);
  } catch (e) {
    // Mock DB insert fallback
  }

  const refWorker1Aadhaar = `cloudinary:image:sevikaa/workers/${worker1Id}/aadhaar/front/doc_123`;

  // TEST 7: Worker 1 can access own authorized media (/api/upload/cloudinary/sign)
  const tokenWorker1 = generateTestToken(worker1Id, 'worker1@sevikaa.in');
  const reqWorker1 = new NextRequest(`http://localhost:3000/api/upload/cloudinary/sign?ref=${encodeURIComponent(refWorker1Aadhaar)}`, {
    headers: { Authorization: `Bearer ${tokenWorker1}` }
  });
  const resWorker1 = await cloudinarySignGET(reqWorker1);
  const textWorker1 = await resWorker1.text();
  console.log(`Debug Worker 1 status: ${resWorker1.status}, body: ${textWorker1}`);
  assert('7. Worker can access own authorized media (200 OK with signed URL)',
    resWorker1.status === 200);

  // TEST 8: Worker 2 cannot access Worker 1's Aadhaar (403 Forbidden)
  const tokenWorker2 = generateTestToken(worker2Id, 'worker2@sevikaa.in');
  const reqWorker2 = new NextRequest(`http://localhost:3000/api/upload/cloudinary/sign?ref=${encodeURIComponent(refWorker1Aadhaar)}`, {
    headers: { Authorization: `Bearer ${tokenWorker2}` }
  });
  const resWorker2 = await cloudinarySignGET(reqWorker2);
  assert('8. Another worker cannot access Worker 1 media (403 Forbidden)',
    resWorker2.status === 403);

  // TEST 9: Employer cannot directly access worker Aadhaar via direct sign route (403 Forbidden)
  const tokenEmployer = generateTestToken(employerId, 'employer@sevikaa.in');
  const reqEmployer = new NextRequest(`http://localhost:3000/api/upload/cloudinary/sign?ref=${encodeURIComponent(refWorker1Aadhaar)}`, {
    headers: { Authorization: `Bearer ${tokenEmployer}` }
  });
  const resEmployer = await cloudinarySignGET(reqEmployer);
  assert('9. Employer cannot directly access worker Aadhaar (403 Forbidden)',
    resEmployer.status === 403);

  // TEST 10: Admin can access authorized worker documents (200 OK)
  const tokenAdmin = generateTestToken(adminId, 'admin@sevikaa.in', 'admin');
  const reqAdmin = new NextRequest(`http://localhost:3000/api/upload/cloudinary/sign?ref=${encodeURIComponent(refWorker1Aadhaar)}`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  const resAdmin = await cloudinarySignGET(reqAdmin);
  assert('10. Admin can access authorized documents through secure mechanism (200 OK)',
    resAdmin.status === 200);

  // TEST 11: Invalid/unauthenticated request is rejected (401 Unauthorized)
  const reqUnauth = new NextRequest(`http://localhost:3000/api/upload/cloudinary/sign?ref=${encodeURIComponent(refWorker1Aadhaar)}`);
  const resUnauth = await cloudinarySignGET(reqUnauth);
  assert('11. Expired/invalid signed access request is rejected (401 Unauthorized)',
    resUnauth.status === 401);

  console.log('\n====================================================');
  console.log(`📊 TASK A1 STORAGE SECURITY TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTaskA1Tests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
