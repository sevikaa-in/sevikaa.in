-- 1. Create sms_templates table
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key text NOT NULL,
    category text NOT NULL CHECK (category IN ('authentication', 'worker_notification', 'employer_notification')),
    provider text NOT NULL CHECK (provider IN ('aws', 'msg91', 'twilio', 'gupshup')),
    sender_id text DEFAULT 'SEVKAA',
    dlt_template_id text,
    language text NOT NULL DEFAULT 'en',
    title text,
    message text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (template_key, provider, language, version)
);

-- 2. Create sms_audit_logs table
CREATE TABLE IF NOT EXISTS public.sms_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key text,
    provider text NOT NULL,
    recipient_phone text NOT NULL,
    message text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb,
    dlt_template_id text,
    sender_id text,
    status text NOT NULL CHECK (status IN ('success', 'failed')),
    error_message text,
    message_id text,
    sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_templates_lookup ON public.sms_templates (template_key, provider, language, is_active);
CREATE INDEX IF NOT EXISTS idx_sms_audit_logs_created_at ON public.sms_audit_logs (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "SMS templates readable by authenticated users" ON public.sms_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "SMS templates manageable by admins only" ON public.sms_templates
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "SMS logs readable by admins only" ON public.sms_audit_logs
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 6. Seed the 12 Core templates for multiple providers (AWS, MSG91, Twilio)
-- Authentication templates
INSERT INTO public.sms_templates (template_key, category, provider, sender_id, language, title, message) VALUES
('LOGIN_OTP', 'authentication', 'aws', 'SEVKAA', 'en', 'Login OTP', 'Your Sevikaa verification code is {{otp}}.
Valid for {{expiry}} minutes.
Do not share this code with anyone.'),
('LOGIN_OTP', 'authentication', 'msg91', 'SEVKAA', 'en', 'Login OTP', 'Your Sevikaa verification code is {{otp}}.
Valid for {{expiry}} minutes.
Do not share this code with anyone.'),
('LOGIN_OTP', 'authentication', 'twilio', 'SEVKAA', 'en', 'Login OTP', 'Your Sevikaa verification code is {{otp}}.
Valid for {{expiry}} minutes.
Do not share this code with anyone.'),

('REGISTER_OTP', 'authentication', 'aws', 'SEVKAA', 'en', 'Registration OTP', 'Welcome to Sevikaa.
Your registration verification code is {{otp}}.
Valid for {{expiry}} minutes.'),
('REGISTER_OTP', 'authentication', 'msg91', 'SEVKAA', 'en', 'Registration OTP', 'Welcome to Sevikaa.
Your registration verification code is {{otp}}.
Valid for {{expiry}} minutes.'),
('REGISTER_OTP', 'authentication', 'twilio', 'SEVKAA', 'en', 'Registration OTP', 'Welcome to Sevikaa.
Your registration verification code is {{otp}}.
Valid for {{expiry}} minutes.'),

('FORGOT_PASSWORD_OTP', 'authentication', 'aws', 'SEVKAA', 'en', 'Forgot Password OTP', 'Your Sevikaa password reset code is {{otp}}.
Valid for {{expiry}} minutes.'),
('FORGOT_PASSWORD_OTP', 'authentication', 'msg91', 'SEVKAA', 'en', 'Forgot Password OTP', 'Your Sevikaa password reset code is {{otp}}.
Valid for {{expiry}} minutes.'),
('FORGOT_PASSWORD_OTP', 'authentication', 'twilio', 'SEVKAA', 'en', 'Forgot Password OTP', 'Your Sevikaa password reset code is {{otp}}.
Valid for {{expiry}} minutes.'),

('CHANGE_MOBILE_OTP', 'authentication', 'aws', 'SEVKAA', 'en', 'Change Mobile OTP', 'Verify your new mobile number using OTP {{otp}}.
Valid for {{expiry}} minutes.'),
('CHANGE_MOBILE_OTP', 'authentication', 'msg91', 'SEVKAA', 'en', 'Change Mobile OTP', 'Verify your new mobile number using OTP {{otp}}.
Valid for {{expiry}} minutes.'),
('CHANGE_MOBILE_OTP', 'authentication', 'twilio', 'SEVKAA', 'en', 'Change Mobile OTP', 'Verify your new mobile number using OTP {{otp}}.
Valid for {{expiry}} minutes.');

-- Worker Notification templates
INSERT INTO public.sms_templates (template_key, category, provider, sender_id, language, title, message) VALUES
('JOB_APPLIED', 'worker_notification', 'aws', 'SEVKAA', 'en', 'Job Application Submitted', 'Your application for {{job_title}} has been submitted successfully.'),
('JOB_APPLIED', 'worker_notification', 'msg91', 'SEVKAA', 'en', 'Job Application Submitted', 'Your application for {{job_title}} has been submitted successfully.'),
('JOB_APPLIED', 'worker_notification', 'twilio', 'SEVKAA', 'en', 'Job Application Submitted', 'Your application for {{job_title}} has been submitted successfully.'),

('JOB_ACCEPTED', 'worker_notification', 'aws', 'SEVKAA', 'en', 'Job Accepted', 'Congratulations!
Your application for {{job_title}} has been accepted by {{company}}.'),
('JOB_ACCEPTED', 'worker_notification', 'msg91', 'SEVKAA', 'en', 'Job Accepted', 'Congratulations!
Your application for {{job_title}} has been accepted by {{company}}.'),
('JOB_ACCEPTED', 'worker_notification', 'twilio', 'SEVKAA', 'en', 'Job Accepted', 'Congratulations!
Your application for {{job_title}} has been accepted by {{company}}.'),

('INTERVIEW_SCHEDULED', 'worker_notification', 'aws', 'SEVKAA', 'en', 'Interview Scheduled', 'Interview scheduled on {{date}} at {{time}}.
Check Sevikaa for complete details.'),
('INTERVIEW_SCHEDULED', 'worker_notification', 'msg91', 'SEVKAA', 'en', 'Interview Scheduled', 'Interview scheduled on {{date}} at {{time}}.
Check Sevikaa for complete details.'),
('INTERVIEW_SCHEDULED', 'worker_notification', 'twilio', 'SEVKAA', 'en', 'Interview Scheduled', 'Interview scheduled on {{date}} at {{time}}.
Check Sevikaa for complete details.'),

('WORKER_VERIFIED', 'worker_notification', 'aws', 'SEVKAA', 'en', 'Worker Verification Approved', 'Congratulations!
Your Sevikaa profile has been verified successfully.'),
('WORKER_VERIFIED', 'worker_notification', 'msg91', 'SEVKAA', 'en', 'Worker Verification Approved', 'Congratulations!
Your Sevikaa profile has been verified successfully.'),
('WORKER_VERIFIED', 'worker_notification', 'twilio', 'SEVKAA', 'en', 'Worker Verification Approved', 'Congratulations!
Your Sevikaa profile has been verified successfully.');

-- Employer Notification templates
INSERT INTO public.sms_templates (template_key, category, provider, sender_id, language, title, message) VALUES
('NEW_APPLICATION', 'employer_notification', 'aws', 'SEVKAA', 'en', 'New Worker Applied', 'A new worker has applied for {{job_title}}.
Login to review the application.'),
('NEW_APPLICATION', 'employer_notification', 'msg91', 'SEVKAA', 'en', 'New Worker Applied', 'A new worker has applied for {{job_title}}.
Login to review the application.'),
('NEW_APPLICATION', 'employer_notification', 'twilio', 'SEVKAA', 'en', 'New Worker Applied', 'A new worker has applied for {{job_title}}.
Login to review the application.'),

('SUBSCRIPTION_ACTIVATED', 'employer_notification', 'aws', 'SEVKAA', 'en', 'Subscription Activated', 'Your Sevikaa subscription {{plan_name}} is now active.
Thank you.'),
('SUBSCRIPTION_ACTIVATED', 'employer_notification', 'msg91', 'SEVKAA', 'en', 'Subscription Activated', 'Your Sevikaa subscription {{plan_name}} is now active.
Thank you.'),
('SUBSCRIPTION_ACTIVATED', 'employer_notification', 'twilio', 'SEVKAA', 'en', 'Subscription Activated', 'Your Sevikaa subscription {{plan_name}} is now active.
Thank you.'),

('PAYMENT_SUCCESS', 'employer_notification', 'aws', 'SEVKAA', 'en', 'Payment Successful', 'Payment of ₹{{amount}} received successfully.
Transaction ID: {{transaction_id}}'),
('PAYMENT_SUCCESS', 'employer_notification', 'msg91', 'SEVKAA', 'en', 'Payment Successful', 'Payment of ₹{{amount}} received successfully.
Transaction ID: {{transaction_id}}'),
('PAYMENT_SUCCESS', 'employer_notification', 'twilio', 'SEVKAA', 'en', 'Payment Successful', 'Payment of ₹{{amount}} received successfully.
Transaction ID: {{transaction_id}}'),

('SECURITY_ALERT', 'employer_notification', 'aws', 'SEVKAA', 'en', 'Account Security Alert', 'A security-sensitive action was detected on your Sevikaa account.
If this wasn''t you, contact support immediately.'),
('SECURITY_ALERT', 'employer_notification', 'msg91', 'SEVKAA', 'en', 'Account Security Alert', 'A security-sensitive action was detected on your Sevikaa account.
If this wasn''t you, contact support immediately.'),
('SECURITY_ALERT', 'employer_notification', 'twilio', 'SEVKAA', 'en', 'Account Security Alert', 'A security-sensitive action was detected on your Sevikaa account.
If this wasn''t you, contact support immediately.');
