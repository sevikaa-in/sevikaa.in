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
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 1. Handle AWS SNS Subscription Confirmation URL
    if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
      console.log(`[AWS SES Webhook] Confirming SNS Subscription: ${body.SubscribeURL}`);
      await fetch(body.SubscribeURL).catch(() => {});
      return NextResponse.json({ success: true, message: 'SNS Subscription Confirmed' });
    }

    // 2. Parse SES Notification Message
    let messageData: any = {};
    if (body.Message) {
      try {
        messageData = typeof body.Message === 'string' ? JSON.parse(body.Message) : body.Message;
      } catch (e) {
        messageData = body;
      }
    } else {
      messageData = body;
    }

    const notificationType = (messageData.notificationType || messageData.eventType || 'Delivery').toLowerCase();
    const mailInfo = messageData.mail || {};
    const recipients = Array.isArray(mailInfo.destination) ? mailInfo.destination.join(', ') : (mailInfo.destination || 'Unknown Recipient');
    const messageId = mailInfo.messageId || null;
    const status = notificationType === 'bounce' ? 'bounced' : notificationType === 'complaint' ? 'complaint' : 'delivered';
    const description = messageData.bounce?.bouncedRecipients?.[0]?.diagnosticCode || `AWS SES Email Status: ${status}`;

    // Ensure public.notification_logs table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.notification_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        channel text NOT NULL DEFAULT 'email',
        provider text NOT NULL DEFAULT 'aws_ses',
        recipient text NOT NULL,
        template_id text,
        message_id text,
        status text NOT NULL DEFAULT 'delivered',
        description text,
        raw_payload text,
        created_at timestamptz DEFAULT NOW()
      );
    `).catch(() => {});

    await queryDb(`
      INSERT INTO public.notification_logs (channel, provider, recipient, template_id, message_id, status, description, raw_payload, created_at)
      VALUES ('email', 'aws_ses', $1, $2, $3, $4, $5, $6, NOW())
    `, [recipients, mailInfo.source || 'SES Email', messageId, status, description, rawText]);

    // Log security warning if email bounced or resulted in complaint
    if (status === 'bounced' || status === 'complaint') {
      logAuditAction({
        action: `AWS SES Email ${status.toUpperCase()}`,
        category: 'auth_security',
        severity: 'warning',
        actor: 'AWS SES Gateway',
        actorRole: 'System Trigger',
        target_name: recipients,
        target_id: messageId || undefined,
        changes_summary: `Email to ${recipients} resulted in ${status.toUpperCase()}. Diagnostic: ${description}`,
        raw_payload: messageData
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error("POST /api/webhooks/aws-ses error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'AWS SES Webhook Endpoint Active' });
}
