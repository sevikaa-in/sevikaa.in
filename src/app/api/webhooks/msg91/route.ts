import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';
import crypto from 'crypto';

/**
 * MSG91 SMS Delivery Webhook
 * Item 23: Add HMAC-SHA256 signature authentication (MSG91 uses X-Msg91-Hmac header)
 * Item 30: Remove runtime DDL — notification_logs table created in migration 20260810000002
 */

function validateMsg91Hmac(rawBody: string, receivedHmac: string): boolean {
  const webhookSecret = process.env.MSG91_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If secret not configured, log warning and allow in non-production
    console.warn('[msg91] MSG91_WEBHOOK_SECRET not configured — skipping HMAC validation');
    return process.env.NODE_ENV !== 'production';
  }
  if (!receivedHmac) return false;
  const expectedHmac = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expectedHmac);
  const b = Buffer.from(receivedHmac);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();

    // Item 23: Validate MSG91 HMAC signature
    const receivedHmac = req.headers.get('x-msg91-hmac') || req.headers.get('x-webhook-signature') || '';
    if (!validateMsg91Hmac(rawText, receivedHmac)) {
      console.warn('[msg91] HMAC validation failed — rejecting request');
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid webhook signature.' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      // URL-encoded or plain query parameters fallback
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    }

    const reports = Array.isArray(body) ? body : (body.logs ? body.logs : [body]);

    // Item 30: Remove runtime DDL — table created in migration 20260810000002
    for (const item of reports) {
      const recipient = item.telNum || item.mobile || item.receiver || item.phone || item.to || 'Unknown Mobile';
      const status = (item.status || item.delivery_status || 'delivered').toLowerCase();
      const messageId = item.requestId || item.CRQID || item.msgId || item.request_id || null;
      const templateId = item.DLT_TE_ID || item.templateId || item.template_id || item.dlt_template_id || null;
      const description = item.failureReason || item.desc || item.description || item.reason || `MSG91 SMS status: ${status}`;

      await queryDb(
        `INSERT INTO public.notification_logs (channel, provider, recipient, template_id, message_id, status, description, raw_payload, created_at)
         VALUES ('sms', 'msg91', $1, $2, $3, $4, $5, $6, NOW())`,
        [recipient, templateId, messageId, status, description, JSON.stringify(item)]
      );

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
    console.error('POST /api/webhooks/msg91 error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'MSG91 Webhook Endpoint Active' });
}
