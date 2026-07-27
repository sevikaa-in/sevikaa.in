const fs = require('fs');
const path = require('path');
const { Client } = require('c:/Sevikaa/node_modules/pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found at', envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const equalIdx = trimmed.indexOf('=');
    if (equalIdx > 0) {
      const key = trimmed.slice(0, equalIdx).trim();
      let val = trimmed.slice(equalIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const connectionString = env.DATABASE_URL;

async function runTests() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database successfully!');

    // 1. Verify sms_templates table structure
    const { rows: templatesExist } = await client.query(`
      SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_templates');
    `);
    if (!templatesExist[0].exists) {
      throw new Error('sms_templates table does not exist!');
    }
    console.log('✓ Verified: public.sms_templates table exists.');

    // 2. Verify sms_audit_logs table structure
    const { rows: logsExist } = await client.query(`
      SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_audit_logs');
    `);
    if (!logsExist[0].exists) {
      throw new Error('sms_audit_logs table does not exist!');
    }
    console.log('✓ Verified: public.sms_audit_logs table exists.');

    // 3. Count seeded templates
    const { rows: templateCountRows } = await client.query('SELECT count(*) FROM public.sms_templates');
    console.log(`✓ Verified: Seeded templates count: ${templateCountRows[0].count} entries.`);

    // 4. Verify specific template keys are seeded
    const expectedKeys = [
      'LOGIN_OTP', 'REGISTER_OTP', 'FORGOT_PASSWORD_OTP', 'CHANGE_MOBILE_OTP',
      'JOB_APPLIED', 'JOB_ACCEPTED', 'INTERVIEW_SCHEDULED', 'WORKER_VERIFIED',
      'NEW_APPLICATION', 'SUBSCRIPTION_ACTIVATED', 'PAYMENT_SUCCESS', 'SECURITY_ALERT'
    ];

    const { rows: seededKeysRows } = await client.query('SELECT DISTINCT template_key FROM public.sms_templates');
    const seededKeys = new Set(seededKeysRows.map(r => r.template_key));

    for (const key of expectedKeys) {
      if (!seededKeys.has(key)) {
        throw new Error(`Seeded template keys missing key: ${key}`);
      }
    }
    console.log(`✓ Verified: All 12 expected template keys exist in the database: [${expectedKeys.join(', ')}]`);

    // 5. Verify OTP templates contain {{expiry}} and linebreaks
    const { rows: otpTemplates } = await client.query(`
      SELECT template_key, message FROM public.sms_templates WHERE template_key IN ('LOGIN_OTP', 'REGISTER_OTP', 'FORGOT_PASSWORD_OTP', 'CHANGE_MOBILE_OTP')
    `);

    for (const row of otpTemplates) {
      if (!row.message.includes('{{expiry}}')) {
        throw new Error(`Template ${row.template_key} should contain {{expiry}} placeholder!`);
      }
      if (!row.message.includes('\n')) {
        throw new Error(`Template ${row.template_key} should contain newline linebreaks!`);
      }
    }
    console.log('✓ Verified: All OTP templates contain multiline linebreaks and the {{expiry}} variable placeholder.');

    console.log('ALL DATABASE INTEGRITY TESTS PASSED!');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTests();
