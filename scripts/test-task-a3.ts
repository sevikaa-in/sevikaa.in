import { AWSProvider, MSG91Provider, TwilioProvider, GupshupProvider } from '../src/lib/smsService';
import { sendEmail } from '../src/lib/notifications';

async function runTaskA3Tests() {
  console.log('====================================================');
  console.log('🛡️ SEVIKAA RELEASE HARDENING — TASK A3 SECURITY TESTS');
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

  // Backup original env vars
  const origEnv = { ...process.env };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Production + missing AWS credentials -> failure
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.AWS_SES_ACCESS_KEY_ID;
    delete process.env.AWS_SES_SECRET_ACCESS_KEY;
    delete process.env.ENABLE_MOCK_NOTIFICATIONS;
    delete process.env.ALLOW_MOCK_NOTIFICATIONS;

    const awsProvider = new AWSProvider();
    const awsRes = await awsProvider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('1. Production + missing AWS credentials returns failure (success: false)',
      awsRes.success === false && !awsRes.messageId && typeof awsRes.error === 'string');

    // -------------------------------------------------------------------------
    // TEST 2: Production + missing MSG91 credentials -> failure
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.MSG91_AUTH_KEY;

    const msg91Provider = new MSG91Provider();
    const msg91Res = await msg91Provider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('2. Production + missing MSG91 credentials returns failure (success: false)',
      msg91Res.success === false && !msg91Res.messageId && typeof msg91Res.error === 'string');

    // -------------------------------------------------------------------------
    // TEST 3: Production + missing Twilio credentials -> failure
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;

    const twilioProvider = new TwilioProvider();
    const twilioRes = await twilioProvider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('3. Production + missing Twilio credentials returns failure (success: false)',
      twilioRes.success === false && !twilioRes.messageId && typeof twilioRes.error === 'string');

    // -------------------------------------------------------------------------
    // TEST 4: Production + missing Gupshup credentials -> failure
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.GUPSHUP_USER_ID;
    delete process.env.GUPSHUP_PASSWORD;

    const gupshupProvider = new GupshupProvider();
    const gupshupRes = await gupshupProvider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('4. Production + missing Gupshup credentials returns failure (success: false)',
      gupshupRes.success === false && !gupshupRes.messageId && typeof gupshupRes.error === 'string');

    // -------------------------------------------------------------------------
    // TEST 5: Production + missing Email credentials -> failure
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.AWS_SES_ACCESS_KEY_ID;

    const emailRes = await sendEmail('test@sevikaa.in', 'Test Subject', '<p>Test</p>');
    assert('5. Production + missing Email credentials returns failure (success: false)',
      emailRes.success === false && !emailRes.messageId && typeof emailRes.error === 'string');

    // -------------------------------------------------------------------------
    // TEST 6: Non-production + explicit mock flag -> mock allowed
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_MOCK_NOTIFICATIONS = 'true';

    const mockAwsRes = await awsProvider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('6. Non-production + explicit ENABLE_MOCK_NOTIFICATIONS=true allows mock mode',
      mockAwsRes.success === true && typeof mockAwsRes.messageId === 'string');

    // -------------------------------------------------------------------------
    // TEST 7: Non-production + NO mock flag -> fails closed (no auto mocks)
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_MOCK_NOTIFICATIONS;
    delete process.env.ALLOW_MOCK_NOTIFICATIONS;

    const noFlagRes = await msg91Provider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('7. Non-production + missing mock flag fails closed (no automatic mock mode)',
      noFlagRes.success === false && !noFlagRes.messageId);

    // -------------------------------------------------------------------------
    // TEST 8: Production + explicit mock flag set -> STILL FAILS (production mock prohibited)
    // -------------------------------------------------------------------------
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_MOCK_NOTIFICATIONS = 'true';

    const prodMockAttemptRes = await msg91Provider.sendSMS({ phoneNumber: '9876543210', message: 'Test OTP' });
    assert('8. Production ignores ENABLE_MOCK_NOTIFICATIONS and strictly fails closed',
      prodMockAttemptRes.success === false && !prodMockAttemptRes.messageId);

  } finally {
    // Restore original env vars
    process.env = origEnv;
  }

  console.log('\n====================================================');
  console.log(`📊 TASK A3 SECURITY TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTaskA3Tests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
