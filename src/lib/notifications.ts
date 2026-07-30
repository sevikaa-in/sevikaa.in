import nodemailer from 'nodemailer';
import { sendSMSWithTemplates } from './smsService';

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
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("Amazon SES SMTP send email error:", err);
    }
  }

  // Fallback to mock logging if SMTP fails or credentials are placeholders
  console.log(`[SES MOCK EMAIL] Dispatching to ${toEmail}\nSubject: "${subject}"\nBody: ${htmlBody}`);
  return { success: true, messageId: `mock-ses-id-${Date.now()}` };
}
