import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (e) {
      // URL-encoded or plain query parameters fallback
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    }

    // Handle single object or array of delivery reports
    const reports = Array.isArray(body) ? body : (body.logs ? body.logs : [body]);

    // Ensure public.notification_logs table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.notification_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        channel text NOT NULL DEFAULT 'sms',
        provider text NOT NULL DEFAULT 'msg91',
        recipient text NOT NULL,
        template_id text,
        message_id text,
        status text NOT NULL DEFAULT 'delivered',
        description text,
        raw_payload text,
        created_at timestamptz DEFAULT NOW()
      );
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS channel text DEFAULT 'sms';
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS provider text DEFAULT 'msg91';
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS recipient text;
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS template_id text;
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS message_id text;
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'delivered';
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS raw_payload text;
    `).catch(() => {});

    for (const item of reports) {
      const recipient = item.telNum || item.mobile || item.receiver || item.phone || item.to || 'Unknown Mobile';
      const status = (item.status || item.delivery_status || 'delivered').toLowerCase();
      const messageId = item.requestId || item.CRQID || item.msgId || item.request_id || null;
      const templateId = item.DLT_TE_ID || item.templateId || item.template_id || item.dlt_template_id || null;
      const description = item.failureReason || item.desc || item.description || item.reason || `MSG91 SMS status: ${status}`;

      await queryDb(`
        INSERT INTO public.notification_logs (channel, provider, recipient, template_id, message_id, status, description, raw_payload, created_at)
        VALUES ('sms', 'msg91', $1, $2, $3, $4, $5, $6, NOW())
      `, [recipient, templateId, messageId, status, description, JSON.stringify(item)]);

      // Also log security/compliance audit if SMS failed or rejected
      if (status === 'failed' || status === 'rejected' || status === 'bounced') {
        logAuditAction({
          action: 'MSG91 SMS Delivery Failed',
          category: 'auth_security',
          severity: 'warning',
          actor: 'MSG91 SMS Gateway',
          actorRole: 'System Trigger',
          target_name: recipient,
          target_id: messageId || undefined,
          changes_summary: `SMS to ${recipient} failed delivery via MSG91. Reason: ${description}`,
          raw_payload: item
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, count: reports.length });
  } catch (err: any) {
    console.error("POST /api/webhooks/msg91 error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'MSG91 Webhook Endpoint Active' });
}
