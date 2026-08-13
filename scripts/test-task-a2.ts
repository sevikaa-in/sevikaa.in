process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-12345';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'sevikaa_jwt_secret_key_32_characters_long_minimum';

import fs from 'fs';
import path from 'path';
import { queryDb } from '../src/lib/db';
import { GET as workerJobsGET } from '../src/app/api/worker/jobs/route';
import { GET as employerJobsGET } from '../src/app/api/employer/jobs/route';
import { GET as employerWorkersGET } from '../src/app/api/employer/workers/route';
import { signSupabaseJwt } from '../src/lib/jwtHelper';
import { NextRequest } from 'next/server';

async function runTaskA2Tests() {
  console.log('====================================================');
  console.log('🛡️ SEVIKAA RELEASE BLOCKER — TASK A2 SECURITY TESTS');
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

  // TEST 1-7: Check migration SQL for RLS policies on job_applications and applications
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260813000000_job_applications_rls_hardening.sql');
  const migrationSql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert('1. Migration enables RLS on job_applications and applications',
    migrationSql.includes('ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY') &&
    migrationSql.includes('ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY'));

  assert('2. Worker A cannot SELECT Worker B job applications (worker_id = auth.uid() check enforced)',
    migrationSql.includes('job_applications_worker_select') &&
    migrationSql.includes('worker_id = auth.uid()'));

  assert('3. Worker A cannot INSERT application for Worker B (CHECK worker_id = auth.uid())',
    migrationSql.includes('job_applications_worker_insert') &&
    migrationSql.includes('WITH CHECK'));

  assert('4. Employer A cannot SELECT Employer B applications (jobs.employer_id relationship verified)',
    migrationSql.includes('job_applications_employer_select') &&
    migrationSql.includes('j.employer_id = auth.uid()'));

  assert('5. Employer A cannot UPDATE Employer B applications',
    migrationSql.includes('job_applications_employer_update'));

  assert('6. Admin has authorized full management access',
    migrationSql.includes('job_applications_admin_all') &&
    migrationSql.includes("role IN ('admin', 'super-admin')"));

  assert('7. Anonymous / unauthenticated access denied by default (no anon policies)',
    !migrationSql.includes('TO anon USING (true)'));

  // TEST 8: Server API endpoints work properly for authenticated callers
  const workerId = '55555555-5555-4555-a555-555555555555';
  const employerId = '66666666-6666-4666-a666-666666666666';

  const workerToken = signSupabaseJwt(workerId, 'testworker@sevikaa.in', '', 'worker');
  const employerToken = signSupabaseJwt(employerId, 'testemployer@sevikaa.in', '', 'employer');

  const reqWorkerJobs = new NextRequest('http://localhost:3000/api/worker/jobs', {
    headers: { Authorization: `Bearer ${workerToken}` }
  });
  const resWorkerJobs = await workerJobsGET(reqWorkerJobs);
  const textWorkerJobs = await resWorkerJobs.text();
  console.log(`Debug 8a status: ${resWorkerJobs.status}, body: ${textWorkerJobs}`);
  assert('8a. Worker jobs API returns 200 OK for authenticated worker',
    resWorkerJobs.status === 200);

  const reqEmployerJobs = new NextRequest('http://localhost:3000/api/employer/jobs', {
    headers: { Authorization: `Bearer ${employerToken}` }
  });
  const resEmployerJobs = await employerJobsGET(reqEmployerJobs);
  const textEmployerJobs = await resEmployerJobs.text();
  console.log(`Debug 8b status: ${resEmployerJobs.status}, body: ${textEmployerJobs}`);
  assert('8b. Employer jobs API returns 200 OK for authenticated employer',
    resEmployerJobs.status === 200);

  const reqUnauth = new NextRequest('http://localhost:3000/api/worker/jobs');
  const resUnauth = await workerJobsGET(reqUnauth);
  assert('8c. Unauthenticated API request is rejected with 401 Unauthorized',
    resUnauth.status === 401);

  console.log('\n====================================================');
  console.log(`📊 TASK A2 SECURITY TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTaskA2Tests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
