import nodemailer from 'nodemailer';
import { sendSMSWithTemplates } from './smsService';
import { logNotificationDispatch } from './notificationLogger';

export * from './emailTemplates';

const awsAccessKey = process.env.AWS_SES_ACCESS_KEY_ID || '';
const awsSecretKey = process.env.AWS_SES_SECRET_ACCESS_KEY || '';
const awsRegion = process.env.AWS_SES_REGION || 'ap-southeast-2';
const sourceEmail = process.env.AWS_SES_SOURCE_EMAIL || 'support@sevikaa.in';

// Check if SES SMTP credentials are configured
const isSESConfigured = awsAccessKey && !awsAccessKey.includes('placeholder') &&
                        awsSecretKey && !awsSecretKey.includes('placeholder');

// Create Nodemailer SMTP Transporter using Amazon SES SMTP Server
const smtpTransporter = isSESConfigured
  ? nodemailer.createTransport({
      host: `email-smtp.${awsRegion}.amazonaws.com`,
      port: 587,
      secure: false, // TLS via port 587
      auth: {
        user: awsAccessKey,
        pass: awsSecretKey,
      },
    })
  : null;

/**
 * Sends a transactional SMS notification via MSG91 SMS Gateway
 */
export async function sendSMS(
  phoneNumber: string,
  templateKey: string,
  variables: Record<string, string> = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await sendSMSWithTemplates({
      templateKey: templateKey.includes(' ') ? 'SECURITY_ALERT' : templateKey,
      phoneNumber,
      variables
    });

    // Auto-log SMS dispatch to notification_logs table
    if (result.success) {
      await logNotificationDispatch({
        channel: 'sms',
        provider: 'msg91',
        recipient: phoneNumber,
        template_id: templateKey,
        message_id: result.messageId,
        status: 'delivered',
        description: `MSG91 SMS dispatched: ${templateKey}`
      }).catch(() => {});
    } else {
      await logNotificationDispatch({
        channel: 'sms',
        provider: 'msg91',
        recipient: phoneNumber,
        template_id: templateKey,
        status: 'failed',
        description: `MSG91 Error: ${result.error || 'SMS dispatch failed'}`
      }).catch(() => {});
    }

    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (err: any) {
    console.error("MSG91 send SMS error:", err);
    return { success: false, error: err.message || 'SMS network error' };
  }
}

/**
 * Sends a transactional HTML email via Amazon SES SMTP (Port 587)
 */
export async function sendEmail(
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"Sevikaa" <${sourceEmail}>`,
        to: toEmail,
        subject: subject,
        html: htmlBody,
      });
      console.log(`[LIVE EMAIL SENT via SES SMTP] To: ${toEmail} | Subject: "${subject}" | MessageId: ${info.messageId}`);
      
      // Auto-log AWS SES Email dispatch directly
      await logNotificationDispatch({
        channel: 'email',
        provider: 'aws_ses',
        recipient: toEmail,
        template_id: subject,
        message_id: info.messageId,
        status: 'delivered',
        description: `AWS SES Email sent successfully: ${subject}`
      }).catch(() => {});

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("Amazon SES SMTP send email error:", err);
      await logNotificationDispatch({
        channel: 'email',
        provider: 'aws_ses',
        recipient: toEmail,
        template_id: subject,
        status: 'failed',
        description: `AWS SES Email failed: ${err.message || 'SMTP error'}`
      }).catch(() => {});
      return { success: false, error: err.message || 'AWS SES SMTP email delivery failed' };
    }
  }

  // Check if explicit mock notifications are allowed in non-production
  const { isMockNotificationsAllowed } = await import('./smsService');
  if (isMockNotificationsAllowed()) {
    const mockId = `mock-ses-id-${Date.now()}`;
    console.log(`[MOCK SES EMAIL DISPATCH] To: ${toEmail}\nSubject: "${subject}"`);

    await logNotificationDispatch({
      channel: 'email',
      provider: 'aws_ses',
      recipient: toEmail,
      template_id: subject,
      message_id: mockId,
      status: 'delivered',
      description: `Mock AWS SES Email sent: ${subject}`
    }).catch(() => {});

    return { success: true, messageId: mockId };
  }

  console.error("Amazon SES SMTP credentials missing or unconfigured.");
  await logNotificationDispatch({
    channel: 'email',
    provider: 'aws_ses',
    recipient: toEmail,
    template_id: subject,
    status: 'failed',
    description: 'AWS SES SMTP credentials missing'
  }).catch(() => {});

  return { success: false, error: 'AWS SES SMTP credentials missing or unconfigured' };
}
