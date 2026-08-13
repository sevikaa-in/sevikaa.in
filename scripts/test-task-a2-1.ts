import fs from 'fs';
import path from 'path';

async function runTaskA21Tests() {
  console.log('====================================================');
  console.log('🛡️ SEVIKAA RELEASE HARDENING — TASK A2.1 TESTS');
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

  const mobileSrcDir = path.join(process.cwd(), 'mobile', 'src');

  // Test 1: InviteWorkersScreen uses apiClient and no worker_profiles direct query
  const inviteWorkersFile = fs.readFileSync(path.join(mobileSrcDir, 'screens', 'InviteWorkersScreen.tsx'), 'utf8');
  assert('1. InviteWorkersScreen.tsx uses apiClient', inviteWorkersFile.includes('apiClient.get('));
  assert('2. InviteWorkersScreen.tsx has no direct supabase.from("worker_profiles")', !inviteWorkersFile.includes(".from('worker_profiles')"));

  // Test 2: WorkerProfileScreen has no Supabase fallback
  const workerProfileFile = fs.readFileSync(path.join(mobileSrcDir, 'routes', 'worker', 'WorkerProfileScreen.tsx'), 'utf8');
  assert('3. WorkerProfileScreen.tsx uses apiClient.get("/api/auth/me")', workerProfileFile.includes('apiClient.get'));
  assert('4. WorkerProfileScreen.tsx has no direct Supabase profile/worker_profile queries',
    !workerProfileFile.includes(".from('profiles')") && !workerProfileFile.includes(".from('worker_profiles')"));

  // Test 3: WorkerNotificationsScreen uses apiClient for profile and jobs
  const workerNotifFile = fs.readFileSync(path.join(mobileSrcDir, 'routes', 'worker', 'WorkerNotificationsScreen.tsx'), 'utf8');
  assert('5. WorkerNotificationsScreen.tsx uses apiClient', workerNotifFile.includes('apiClient.get'));
  assert('6. WorkerNotificationsScreen.tsx has no direct profiles or jobs queries',
    !workerNotifFile.includes(".from('profiles')") && !workerNotifFile.includes(".from('jobs')"));
  assert('7. WorkerNotificationsScreen.tsx preserves missing API job_applications query',
    workerNotifFile.includes(".from('job_applications')"));

  // Test 4: EmployerNotificationsScreen uses apiClient for jobs
  const employerNotifFile = fs.readFileSync(path.join(mobileSrcDir, 'routes', 'employer', 'EmployerNotificationsScreen.tsx'), 'utf8');
  assert('8. EmployerNotificationsScreen.tsx uses apiClient', employerNotifFile.includes('apiClient.get'));
  assert('9. EmployerNotificationsScreen.tsx has no direct jobs query', !employerNotifFile.includes(".from('jobs')"));

  // Test 5: Scan all files in mobile/src for remaining supabase.from(
  console.log('\n--- SCANNING mobile/src FOR ALL REMAINING supabase.from( OCCURRENCES ---');
  
  function scanDir(dir: string, results: Array<{ file: string; line: number; text: string }> = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, results);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((lineText, idx) => {
          if (lineText.includes('.from(')) {
            const relativePath = path.relative(path.join(process.cwd(), 'mobile'), fullPath).replace(/\\/g, '/');
            results.push({ file: relativePath, line: idx + 1, text: lineText.trim() });
          }
        });
      }
    }
    return results;
  }

  const remainingFromCalls = scanDir(mobileSrcDir);
  console.log(`Found ${remainingFromCalls.length} total remaining .from() calls in mobile/src:\n`);
  remainingFromCalls.forEach(r => {
    console.log(` - ${r.file}:${r.line} -> ${r.text}`);
  });

  // Verify that remaining target table calls are ONLY those with missing API endpoints
  const targetTables = ['job_applications', 'applications', 'jobs', 'profiles', 'worker_profiles', 'employer_profiles'];
  const remainingTargetCalls = remainingFromCalls.filter(r => 
    targetTables.some(t => r.text.includes(`'${t}'`) || r.text.includes(`"${t}"`))
  );

  console.log(`\nTarget Table Remaining Calls (${remainingTargetCalls.length}):`);
  remainingTargetCalls.forEach(r => {
    console.log(`   📌 ${r.file}:${r.line} -> ${r.text}`);
  });

  assert('10. Target table direct queries remaining are strictly missing API operations',
    remainingTargetCalls.every(r => r.file.includes('InterviewsScreen') || r.file.includes('WorkerNotificationsScreen') || r.file.includes('WorkerInterviewsScreen')));

  console.log('\n====================================================');
  console.log(`📊 TASK A2.1 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTaskA21Tests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
