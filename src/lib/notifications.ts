import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const awsAccessKey = process.env.AWS_SES_ACCESS_KEY_ID || '';
const awsSecretKey = process.env.AWS_SES_SECRET_ACCESS_KEY || '';
const awsRegion = process.env.AWS_SES_REGION || 'ap-south-1';

const msg91AuthKey = process.env.MSG91_AUTH_KEY || '';
const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || '';

// Initialize SES Client if credentials are provided and not placeholders
const isSESConfigured = awsAccessKey && !awsAccessKey.includes('placeholder') &&
                        awsSecretKey && !awsSecretKey.includes('placeholder');

const sesClient = isSESConfigured
  ? new SESClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
      },
    })
  : null;

/**
 * Sends a transactional SMS notification via MSG91 SMS Gateway
 * Falls back to mock logging if configurations are placeholders.
 * 
 * @param phoneNumber Indian mobile phone number (10 digits or with prefix)
 * @param message Text contents to dispatch
 * @param variables Optional templating variables for MSG91 triggers
 */
export async function sendSMS(
  phoneNumber: string,
  message: string,
  variables?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isMSG91Configured = msg91AuthKey && !msg91AuthKey.includes('placeholder');

  if (!isMSG91Configured) {
    console.log(`[MSG91 MOCK SMS] Dispatching to ${phoneNumber}: "${message}"`);
    return { success: true, messageId: `mock-msg91-id-${Date.now()}` };
  }

  try {
    // Standard MSG91 Flow
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const phoneWithCountry = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const payload = {
      template_id: msg91TemplateId,
      mobile: phoneWithCountry,
      authkey: msg91AuthKey,
      ...variables
    };

    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.type === 'success') {
      return { success: true, messageId: data.message };
    } else {
      return { success: false, error: data.message || 'MSG91 API error' };
    }
  } catch (err: any) {
    console.error("MSG91 send SMS error:", err);
    return { success: false, error: err.message || 'SMS network error' };
  }
}

/**
 * Sends a transactional HTML email via Amazon SES
 * Falls back to mock logging if configurations are placeholders.
 * 
 * @param toEmail Recipient email address
 * @param subject Email subject headline
 * @param htmlBody Email body contents formatted in HTML
 */
export async function sendEmail(
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!sesClient) {
    console.log(`[SES MOCK EMAIL] Dispatching to ${toEmail}\nSubject: "${subject}"\nBody: ${htmlBody}`);
    return { success: true, messageId: `mock-ses-id-${Date.now()}` };
  }

  try {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: 'noreply@sevikaa.in', // Must be verified in Amazon SES Console
    });

    const response = await sesClient.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (err: any) {
    console.error("Amazon SES send email error:", err);
    return { success: false, error: err.message || 'SES service error' };
  }
}
