import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';
import crypto from 'crypto';

/**
 * AWS SES / SNS Webhook Handler
 * Item 22: Validate SNS message signature before processing (SSRF + spoofing protection)
 * Item 30: Remove runtime DDL — notification_logs table is created in migration 20260810000002
 */

const TRUSTED_SNS_REGIONS = ['us-east-1', 'ap-south-1', 'ap-southeast-2', 'us-west-2', 'eu-west-1'];
const SNS_CERT_URL_REGEX = /^https:\/\/sns\.(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]\.amazonaws\.com\//;

async function validateSnsSignature(body: any): Promise<boolean> {
  try {
    const { SignatureVersion, SigningCertURL, Signature, Message, MessageId, Subject, Timestamp, TopicArn, Type, SubscribeURL, Token } = body;
    if (SignatureVersion !== '1') return false;
    if (!SigningCertURL || !SNS_CERT_URL_REGEX.test(SigningCertURL)) return false;

    // Fetch SNS signing certificate
    const certRes = await fetch(SigningCertURL, { signal: AbortSignal.timeout(5000) });
    if (!certRes.ok) return false;
    const certPem = await certRes.text();

    // Build string-to-sign for Notification
    let strToSign = '';
    if (Type === 'Notification') {
      strToSign = `Message\n${Message}\nMessageId\n${MessageId}\n`;
      if (Subject) strToSign += `Subject\n${Subject}\n`;
      strToSign += `Timestamp\n${Timestamp}\nTopicArn\n${TopicArn}\nType\n${Type}\n`;
    } else if (Type === 'SubscriptionConfirmation' || Type === 'UnsubscribeConfirmation') {
      strToSign = `Message\n${Message}\nMessageId\n${MessageId}\nSubscribeURL\n${SubscribeURL}\nTimestamp\n${Timestamp}\nToken\n${Token}\nTopicArn\n${TopicArn}\nType\n${Type}\n`;
    }

    const verify = crypto.createVerify('RSA-SHA1');
    verify.update(strToSign, 'utf8');
    return verify.verify(certPem, Signature, 'base64');
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Item 22: Validate SNS signature before processing (SSRF + spoofing protection)
    // Only enforce in production (avoid blocking local dev with unsigned messages)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await validateSnsSignature(body);
      if (!isValid) {
        console.warn('[aws-ses] SNS signature validation failed — rejecting request');
        return NextResponse.json({ error: 'Unauthorized', message: 'Invalid SNS signature.' }, { status: 401 });
      }
    }

    // 1. Handle AWS SNS Subscription Confirmation
    if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
      // Validate SubscribeURL is an SNS URL before fetching (SSRF protection)
      if (!SNS_CERT_URL_REGEX.test(body.SubscribeURL)) {
        return NextResponse.json({ error: 'Invalid SubscribeURL' }, { status: 400 });
      }
      await fetch(body.SubscribeURL, { signal: AbortSignal.timeout(5000) }).catch(() => {});
      return NextResponse.json({ success: true, message: 'SNS Subscription Confirmed' });
    }

    // 2. Parse SES Notification Message
    let messageData: any = {};
    if (body.Message) {
      try {
        messageData = typeof body.Message === 'string' ? JSON.parse(body.Message) : body.Message;
      } catch {
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

    // Item 30: notification_logs table created in migration 20260810000002 — no runtime DDL
    await queryDb(
      `INSERT INTO public.notification_logs (channel, provider, recipient, template_id, message_id, status, description, raw_payload, created_at)
       VALUES ('email', 'aws_ses', $1, $2, $3, $4, $5, $6, NOW())`,
      [recipients, mailInfo.source || 'SES Email', messageId, status, description, rawText]
    );

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
    console.error('POST /api/webhooks/aws-ses error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'AWS SES Webhook Endpoint Active' });
}
