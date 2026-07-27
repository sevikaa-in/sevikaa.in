import { supabaseAdmin } from './supabaseAdminClient';

/**
 * Interpolates double-bracket variables in a template message with their runtime values.
 * E.g., "Your OTP is {{otp}}" -> "Your OTP is 123456"
 */
export function interpolateVariables(template: string, variables: Record<string, string>): string {
  if (!template) return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Validates whether all variables declared in a template message (e.g. {{otp}}) are provided.
 */
export function validateTemplateVariables(template: string, variables: Record<string, string>): { valid: boolean; missing: string[] } {
  if (!template) return { valid: true, missing: [] };
  const regex = /\{\{\s*(\w+)\s*\}\}/g;
  const missing: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    const key = match[1];
    if (variables[key] === undefined) {
      missing.push(key);
    }
  }
  return { valid: missing.length === 0, missing };
}

export interface SMSProvider {
  sendSMS(params: {
    phoneNumber: string;
    message: string;
    senderId?: string;
    dltTemplateId?: string;
    variables?: Record<string, string>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * AWS Provider utilizing AWS End User Messaging (via AWS SNS SDK)
 * Incorporates Indian DLT metadata parameters via PublishCommand MessageAttributes.
 */
export class AWSProvider implements SMSProvider {
  async sendSMS(params: {
    phoneNumber: string;
    message: string;
    senderId?: string;
    dltTemplateId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const awsAccessKey = process.env.AWS_SES_ACCESS_KEY_ID || '';
    const awsSecretKey = process.env.AWS_SES_SECRET_ACCESS_KEY || '';
    const awsRegion = process.env.AWS_SES_REGION || 'ap-south-1';

    const isConfigured = awsAccessKey && !awsAccessKey.includes('placeholder') &&
                         awsSecretKey && !awsSecretKey.includes('placeholder');

    if (!isConfigured) {
      console.log(`[AWS MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (DLT: ${params.dltTemplateId || 'none'}, SenderID: ${params.senderId || 'SEVKAA'})`);
      return { success: true, messageId: `mock-aws-id-${Date.now()}` };
    }

    try {
      // Dynamic require to prevent errors if running before npm install finishes
      const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
      const snsClient = new SNSClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey,
        },
      });

      const cleanedPhone = params.phoneNumber.replace(/\D/g, '');
      const phoneWithPlus = params.phoneNumber.startsWith('+') ? params.phoneNumber : `+91${cleanedPhone}`;

      // Build message attributes for Indian DLT compliance
      const messageAttributes: Record<string, any> = {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      };

      if (params.senderId) {
        messageAttributes['AWS.SNS.SMS.SenderID'] = {
          DataType: 'String',
          StringValue: params.senderId,
        };
      }

      if (params.dltTemplateId) {
        messageAttributes['AWS.MM.SMS.TemplateId'] = {
          DataType: 'String',
          StringValue: params.dltTemplateId,
        };
      }

      const command = new PublishCommand({
        PhoneNumber: phoneWithPlus,
        Message: params.message,
        MessageAttributes: messageAttributes,
      });

      const response = await snsClient.send(command);
      return { success: true, messageId: response.MessageId };
    } catch (err: any) {
      console.error("AWS SNS SMS error:", err);
      return { success: false, error: err.message || 'AWS SNS SMS failed' };
    }
  }
}

/**
 * MSG91 Adapter utilizing REST POST flow endpoint.
 */
export class MSG91Provider implements SMSProvider {
  async sendSMS(params: {
    phoneNumber: string;
    message: string;
    senderId?: string;
    dltTemplateId?: string;
    variables?: Record<string, string>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const authKey = process.env.MSG91_AUTH_KEY || '';
    const isConfigured = authKey && !authKey.includes('placeholder');

    if (!isConfigured) {
      console.log(`[MSG91 MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (DLT: ${params.dltTemplateId || 'none'}, SenderID: ${params.senderId || 'SEVKAA'})`);
      return { success: true, messageId: `mock-msg91-id-${Date.now()}` };
    }

    try {
      const cleanedPhone = params.phoneNumber.replace(/\D/g, '');
      const phoneWithCountry = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

      // MSG91 OTP API (standard flow support)
      const payload = {
        template_id: params.dltTemplateId || process.env.MSG91_TEMPLATE_ID || '',
        mobile: phoneWithCountry,
        authkey: authKey,
        sender: params.senderId || 'SEVKAA',
        ...params.variables
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
      console.error("MSG91 SMS error:", err);
      return { success: false, error: err.message || 'MSG91 SMS network error' };
    }
  }
}

/**
 * Twilio Adapter utilizing REST Message endpoint (with form URL encoded request)
 */
export class TwilioProvider implements SMSProvider {
  async sendSMS(params: {
    phoneNumber: string;
    message: string;
    senderId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    const isConfigured = accountSid && !accountSid.includes('placeholder') &&
                         authToken && !authToken.includes('placeholder');

    if (!isConfigured) {
      console.log(`[TWILIO MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (SenderID: ${params.senderId || 'SEVKAA'})`);
      return { success: true, messageId: `mock-twilio-id-${Date.now()}` };
    }

    try {
      const cleanedPhone = params.phoneNumber.replace(/\D/g, '');
      const phoneWithPlus = params.phoneNumber.startsWith('+') ? params.phoneNumber : `+91${cleanedPhone}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          },
          body: new URLSearchParams({
            To: phoneWithPlus,
            From: fromNumber,
            Body: params.message,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        return { success: true, messageId: data.sid };
      } else {
        return { success: false, error: data.message || 'Twilio REST API error' };
      }
    } catch (err: any) {
      console.error("Twilio SMS error:", err);
      return { success: false, error: err.message || 'Twilio API network error' };
    }
  }
}

/**
 * Gupshup Adapter utilizing enterprise HTTP REST API
 */
export class GupshupProvider implements SMSProvider {
  async sendSMS(params: {
    phoneNumber: string;
    message: string;
    senderId?: string;
    dltTemplateId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const gupshupUserId = process.env.GUPSHUP_USER_ID || '';
    const gupshupPassword = process.env.GUPSHUP_PASSWORD || '';

    const isConfigured = gupshupUserId && !gupshupUserId.includes('placeholder') &&
                         gupshupPassword && !gupshupPassword.includes('placeholder');

    if (!isConfigured) {
      console.log(`[GUPSHUP MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (DLT: ${params.dltTemplateId || 'none'})`);
      return { success: true, messageId: `mock-gupshup-id-${Date.now()}` };
    }

    try {
      const cleanedPhone = params.phoneNumber.replace(/\D/g, '');
      const phoneWithCountry = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

      const queryParams = new URLSearchParams({
        method: 'SendMessage',
        send_to: phoneWithCountry,
        msg: params.message,
        msg_type: 'TEXT',
        userid: gupshupUserId,
        password: gupshupPassword,
        auth_scheme: 'plain',
        v: '1.1',
        format: 'text',
      });

      if (params.dltTemplateId) {
        queryParams.append('dltTemplateId', params.dltTemplateId);
      }
      if (params.senderId) {
        queryParams.append('mask', params.senderId);
      }

      const response = await fetch('https://enterprise.smsgupshup.com/GatewayAPI/rest?' + queryParams.toString());
      const responseText = await response.text();

      if (responseText.toLowerCase().includes('error')) {
        return { success: false, error: responseText };
      }
      return { success: true, messageId: responseText.trim() };
    } catch (err: any) {
      console.error("Gupshup SMS error:", err);
      return { success: false, error: err.message || 'Gupshup API error' };
    }
  }
}

export function getProviderInstance(providerKey: string): SMSProvider {
  switch (providerKey.toLowerCase()) {
    case 'aws':
      return new AWSProvider();
    case 'msg91':
      return new MSG91Provider();
    case 'twilio':
      return new TwilioProvider();
    case 'gupshup':
      return new GupshupProvider();
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}

/**
 * Resolves a template from the database, interpolates variables, dispatches via the active provider,
 * and handles fallbacks if primary fails. Tracks everything in public.sms_audit_logs.
 */
export async function sendSMSWithTemplates(params: {
  templateKey: string;
  phoneNumber: string;
  variables: Record<string, string>;
  language?: string;
  userId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string; providerUsed?: string }> {
  const { templateKey, phoneNumber, variables, language = 'en', userId } = params;

  let activeTemplate: any = null;
  let providerUsed = 'aws'; // Baseline provider

  try {
    // 1. Fetch template from DB
    const { data: dbTemplate, error: dbErr } = await supabaseAdmin
      .from('sms_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .eq('language', language)
      .order('version', { ascending: false })
      .limit(1);

    if (dbTemplate && dbTemplate.length > 0) {
      activeTemplate = dbTemplate[0];
      providerUsed = activeTemplate.provider;
    } else {
      // Look for english template as fallback if local language template is missing
      if (language !== 'en') {
        const { data: enTemplate } = await supabaseAdmin
          .from('sms_templates')
          .select('*')
          .eq('template_key', templateKey)
          .eq('is_active', true)
          .eq('language', 'en')
          .order('version', { ascending: false })
          .limit(1);
        if (enTemplate && enTemplate.length > 0) {
          activeTemplate = enTemplate[0];
          providerUsed = activeTemplate.provider;
        }
      }
    }

    // 2. Ultimate hardcoded fallbacks if DB lookup yielded nothing
    if (!activeTemplate) {
      const FALLBACK_TEMPLATES: Record<string, string> = {
        LOGIN_OTP: 'Your Sevikaa verification code is {{otp}}.\nValid for {{expiry}} minutes.\nDo not share this code with anyone.',
        REGISTER_OTP: 'Welcome to Sevikaa.\nYour registration verification code is {{otp}}.\nValid for {{expiry}} minutes.',
        FORGOT_PASSWORD_OTP: 'Your Sevikaa password reset code is {{otp}}.\nValid for {{expiry}} minutes.',
        CHANGE_MOBILE_OTP: 'Verify your new mobile number using OTP {{otp}}.\nValid for {{expiry}} minutes.',
        JOB_APPLIED: 'Your application for {{job_title}} has been submitted successfully.',
        JOB_ACCEPTED: 'Congratulations!\nYour application for {{job_title}} has been accepted by {{company}}.',
        INTERVIEW_SCHEDULED: 'Interview scheduled on {{date}} at {{time}}.\nCheck Sevikaa for complete details.',
        WORKER_VERIFIED: 'Congratulations!\nYour Sevikaa profile has been verified successfully.',
        NEW_APPLICATION: 'A new worker has applied for {{job_title}}.\nLogin to review the application.',
        SUBSCRIPTION_ACTIVATED: 'Your Sevikaa subscription {{plan_name}} is now active.\nThank you.',
        PAYMENT_SUCCESS: 'Payment of ₹{{amount}} received successfully.\nTransaction ID: {{transaction_id}}',
        SECURITY_ALERT: 'A security-sensitive action was detected on your Sevikaa account.\nIf this wasn\'t you, contact support immediately.'
      };
      
      const fallbackMsg = FALLBACK_TEMPLATES[templateKey];
      if (!fallbackMsg) {
        throw new Error(`SMS template key "${templateKey}" not found in database or fallbacks.`);
      }
      activeTemplate = {
        template_key: templateKey,
        provider: 'aws',
        sender_id: 'SEVKAA',
        message: fallbackMsg,
        dlt_template_id: null,
      };
      providerUsed = 'aws';
    }

    // 3. Auto-inject hardcoded expiry of 10 minutes for OTP templates
    if (templateKey.includes('OTP')) {
      variables.expiry = '10';
    }

    // 4. Interpolate variables
    const interpolatedMessage = interpolateVariables(activeTemplate.message, variables);

    // 5. Validate variables
    const validation = validateTemplateVariables(activeTemplate.message, variables);
    if (!validation.valid) {
      throw new Error(`Template variable validation failed. Missing variables: ${validation.missing.join(', ')}`);
    }

    // 6. Send using primary resolved provider
    let provider = getProviderInstance(providerUsed);
    let sendResult = await provider.sendSMS({
      phoneNumber,
      message: interpolatedMessage,
      senderId: activeTemplate.sender_id,
      dltTemplateId: activeTemplate.dlt_template_id,
      variables
    });

    // 7. Handle fallback provider if primary fails or isn't configured
    if (!sendResult.success) {
      console.warn(`Primary provider ${providerUsed} failed to send SMS: ${sendResult.error}. Engaging fallback...`);
      // Determine fallback provider: if primary was AWS, fallback to TWILIO
      const fallbackProviderKey = providerUsed === 'aws' ? 'twilio' : 'aws';
      
      try {
        const fallbackProvider = getProviderInstance(fallbackProviderKey);
        const fallbackResult = await fallbackProvider.sendSMS({
          phoneNumber,
          message: interpolatedMessage,
          senderId: activeTemplate.sender_id || 'SEVKAA',
          dltTemplateId: activeTemplate.dlt_template_id,
          variables
        });
        
        if (fallbackResult.success) {
          sendResult = fallbackResult;
          providerUsed = fallbackProviderKey;
          console.log(`Fallback provider ${fallbackProviderKey} succeeded.`);
        }
      } catch (fallbackErr: any) {
        console.error("Fallback provider execution error:", fallbackErr);
      }
    }

    // 8. Log to audit table
    await supabaseAdmin.from('sms_audit_logs').insert({
      template_key: templateKey,
      provider: providerUsed,
      recipient_phone: phoneNumber,
      message: interpolatedMessage,
      variables: variables,
      dlt_template_id: activeTemplate.dlt_template_id,
      sender_id: activeTemplate.sender_id,
      status: sendResult.success ? 'success' : 'failed',
      error_message: sendResult.success ? null : sendResult.error,
      message_id: sendResult.messageId || null,
      sent_by: userId || null
    });

    return {
      success: sendResult.success,
      messageId: sendResult.messageId,
      error: sendResult.error,
      providerUsed
    };
  } catch (err: any) {
    console.error("sendSMSWithTemplates system exception:", err);
    // Write failure log
    try {
      await supabaseAdmin.from('sms_audit_logs').insert({
        template_key: templateKey,
        provider: providerUsed,
        recipient_phone: phoneNumber,
        message: activeTemplate ? interpolateVariables(activeTemplate.message, variables) : `Failed before template load: ${templateKey}`,
        variables: variables,
        status: 'failed',
        error_message: err.message || 'System exception'
      });
    } catch (dbLogErr) {
      console.error("Failed to log sms audit trail:", dbLogErr);
    }
    
    return { success: false, error: err.message || 'System exception' };
  }
}
