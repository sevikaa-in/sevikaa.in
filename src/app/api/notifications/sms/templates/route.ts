import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. Ensure public.sms_templates table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.sms_templates (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        template_key text NOT NULL,
        category text DEFAULT 'authentication',
        provider text DEFAULT 'msg91',
        sender_id text DEFAULT 'SEVKAA',
        dlt_template_id text,
        language text DEFAULT 'en',
        title text,
        message text,
        is_active boolean DEFAULT true,
        version integer DEFAULT 1,
        created_at timestamptz DEFAULT NOW()
      );
    `).catch(() => {});

    // 2. Delete obsolete legacy providers ('twilio', 'aws', 'Fast2SMS')
    await queryDb(`DELETE FROM public.sms_templates WHERE LOWER(provider) IN ('twilio', 'aws', 'fast2sms') OR provider IS NULL;`).catch(() => {});

    // 3. Seed official MSG91 & AWS SES default templates if table count is low
    const checkTemplates = await queryDb(`SELECT COUNT(*) FROM public.sms_templates WHERE LOWER(provider) IN ('msg91', 'aws_ses');`).catch(() => null);
    const count = parseInt(checkTemplates?.rows?.[0]?.count || '0', 10);

    if (count === 0) {
      await queryDb(`
        INSERT INTO public.sms_templates (template_key, category, provider, sender_id, dlt_template_id, language, title, message, is_active, version)
        VALUES 
          ('LOGIN_OTP', 'authentication', 'msg91', 'SEVKAA', '12071618293041', 'en', 'MSG91 Login OTP', 'Your Sevikaa verification code is {{otp}}. Valid for 10 minutes. Do not share this code.', true, 1),
          ('REGISTER_OTP', 'authentication', 'msg91', 'SEVKAA', '12071618293042', 'en', 'MSG91 Registration OTP', 'Welcome to Sevikaa. Your registration OTP is {{otp}}. Valid for 10 minutes.', true, 1),
          ('INTERVIEW_SCHEDULED', 'worker_notification', 'msg91', 'SEVKAA', '12071618293043', 'en', 'MSG91 Telephonic Interview Alert', 'Hi {{name}}, your Sevikaa tele-onboarding call is scheduled for {{time}}.', true, 1),
          ('WORKER_VERIFIED', 'worker_notification', 'msg91', 'SEVKAA', '12071618293044', 'en', 'MSG91 Profile Approval Notice', 'Congratulations {{name}}, your Sevikaa worker profile has been APPROVED and is now LIVE.', true, 1),
          ('JOB_ACCEPTED', 'worker_notification', 'msg91', 'SEVKAA', '12071618293045', 'en', 'MSG91 Job Match Accepted', 'Hi {{name}}, your application for {{job_title}} at {{company}} has been accepted.', true, 1),
          ('WELCOME_EMAIL', 'transactional', 'aws_ses', 'support@sevikaa.in', NULL, 'en', 'AWS SES Welcome Email', 'Welcome to Sevikaa domestic workforce platform.', true, 1);
      `).catch(() => {});
    }

    // 4. Fetch ONLY MSG91 (SMS) and AWS SES (Email) templates
    const res = await queryDb(`
      SELECT DISTINCT ON (template_key, provider) *
      FROM public.sms_templates 
      WHERE LOWER(provider) IN ('msg91', 'aws_ses') 
      ORDER BY template_key ASC, provider ASC, created_at DESC;
    `);

    const templates = (res?.rows || []).map((t, idx) => ({
      id: t.id || `tpl_${idx}`,
      template_key: t.template_key || 'LOGIN_OTP',
      category: t.category || 'authentication',
      provider: t.provider || 'msg91',
      sender_id: t.sender_id || 'SEVKAA',
      dlt_template_id: t.dlt_template_id || null,
      language: t.language || 'en',
      title: t.title || 'MSG91 DLT Template',
      message: t.message || '',
      is_active: t.is_active !== false,
      version: t.version || 1
    }));

    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    console.error("GET /api/notifications/sms/templates error:", err);
    return NextResponse.json({ success: false, error: err.message, templates: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_key, category, provider, sender_id, dlt_template_id, language, title, message } = body;

    const res = await queryDb(`
      INSERT INTO public.sms_templates (template_key, category, provider, sender_id, dlt_template_id, language, title, message, is_active, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1)
      RETURNING *;
    `, [
      template_key || 'CUSTOM_TEMPLATE',
      category || 'general',
      provider || 'msg91',
      sender_id || 'SEVKAA',
      dlt_template_id || null,
      language || 'en',
      title || 'Custom DLT Template',
      message || ''
    ]);

    return NextResponse.json({ success: true, template: res?.rows?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
