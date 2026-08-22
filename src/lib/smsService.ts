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

export function isMockNotificationsAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ENABLE_MOCK_NOTIFICATIONS === 'true' || process.env.ALLOW_MOCK_NOTIFICATIONS === 'true';
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
      if (isMockNotificationsAllowed()) {
        console.log(`[AWS MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (DLT: ${params.dltTemplateId || 'none'}, SenderID: ${params.senderId || 'SEVKAA'})`);
        return { success: true, messageId: `mock-aws-id-${Date.now()}` };
      }
      return { success: false, error: 'AWS SMS provider credentials missing or unconfigured' };
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
      if (isMockNotificationsAllowed()) {
        console.log(`[MSG91 MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (DLT: ${params.dltTemplateId || 'none'}, SenderID: ${params.senderId || 'SEVKAA'})`);
        return { success: true, messageId: `mock-msg91-id-${Date.now()}` };
      }
      return { success: false, error: 'MSG91 provider credentials missing or unconfigured' };
    }

    try {
      const cleanedPhone = params.phoneNumber.replace(/\D/g, '');
      const phoneWithCountry = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

      // MSG91 Flow API (For 24-character MSG91 Flow Template IDs e.g. 6a6a31a6a088f7fd010c7e52)
      if (params.dltTemplateId && params.dltTemplateId.length >= 20) {
        // Map backend keys to MSG91 DLT variable tags (number, alphanumeric, etc.)
        const flowVars: Record<string, string> = { ...params.variables };
        if (flowVars.otp && !flowVars.number) {
          flowVars.number = flowVars.otp;
        }
        if (flowVars.date) flowVars.alphanumeric1 = flowVars.date;
        if (flowVars.time) flowVars.alphanumeric2 = flowVars.time;
        if (flowVars.job_title && flowVars.company) {
          flowVars.alphanumeric1 = flowVars.job_title;
          flowVars.alphanumeric2 = flowVars.company;
        } else if (flowVars.job_title) {
          flowVars.alphanumeric = flowVars.job_title;
        }
        if (flowVars.plan_name) flowVars.alphanumeric = flowVars.plan_name;
        if (flowVars.amount && !flowVars.number) flowVars.number = flowVars.amount;
        if (flowVars.transaction_id) flowVars.alphanumeric = flowVars.transaction_id;
        if (flowVars.upload_url && !flowVars.url) flowVars.url = flowVars.upload_url;

        const flowPayload = {
          template_id: params.dltTemplateId,
          short_url: "0",
          recipients: [
            {
              mobiles: phoneWithCountry,
              ...flowVars
            }
          ]
        };

        const flowRes = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': authKey
          },
          body: JSON.stringify(flowPayload)
        });

        const flowData = await flowRes.json();
        if (flowRes.ok && (flowData.type === 'success' || flowData.status === 'success')) {
          return { success: true, messageId: flowData.message || 'msg91-flow-sent' };
        } else {
          console.warn("MSG91 Flow API response notice:", flowData?.type || flowData?.status);
        }
      }

      // Fallback: Standard MSG91 OTP API
      const payload = {
        template_id: params.dltTemplateId || process.env.MSG91_TEMPLATE_ID || '',
        mobile: phoneWithCountry,
        sender: params.senderId || 'SEVKAA',
        ...params.variables
      };

      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.type === 'success' || data.status === 'success') {
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
      if (isMockNotificationsAllowed()) {
        console.log(`[TWILIO MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (SenderID: ${params.senderId || 'SEVKAA'})`);
        return { success: true, messageId: `mock-twilio-id-${Date.now()}` };
      }
      return { success: false, error: 'Twilio provider credentials missing or unconfigured' };
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
      if (isMockNotificationsAllowed()) {
        console.log(`[GUPSHUP MOCK SMS] Dispatching to ${params.phoneNumber}: "${params.message}" (DLT: ${params.dltTemplateId || 'none'})`);
        return { success: true, messageId: `mock-gupshup-id-${Date.now()}` };
      }
      return { success: false, error: 'Gupshup provider credentials missing or unconfigured' };
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

  const isOtpTemplate = templateKey.endsWith('_OTP') || templateKey.includes('OTP');

  // For OTP templates: use ENV variables for DLT Template ID, do NOT query DB for template config
  if (isOtpTemplate) {
    const envDltId = process.env[`MSG91_TEMPLATE_ID_${templateKey}`];
    const effectiveDltId = (envDltId && !envDltId.includes('placeholder')) ? envDltId : (process.env.MSG91_TEMPLATE_ID || null);

    const FALLBACK_TEMPLATES: Record<string, string> = {
      LOGIN_OTP: 'Your Sevikaa verification code is {{otp}}.\nValid for 10 minutes.\nDo not share this code with anyone.',
      OTP_VERIFICATION: 'Your Sevikaa verification code is {{otp}}.\nValid for 10 minutes.\nDo not share this code with anyone.',
      REGISTER_OTP: 'Welcome to Sevikaa.\nYour registration verification code is {{otp}}.\nValid for 10 minutes.',
      FORGOT_PASSWORD_OTP: 'Your Sevikaa password reset code is {{otp}}.\nValid for 10 minutes.',
      CHANGE_MOBILE_OTP: 'Verify your new mobile number on Sevikaa using OTP {{otp}}. Valid for 10 minutes. Team Sevikaa.',
      DELETE_ACCOUNT_OTP: 'Sevikaa: Your OTP to request account deletion is {{otp}}.\nValid for 10 minutes.\nDo not share with anyone.',
    };

    const templateMessage = FALLBACK_TEMPLATES[templateKey] || 'Your Sevikaa verification code is {{otp}}.\nValid for 10 minutes.';
    const interpolatedMessage = interpolateVariables(templateMessage, variables);

    const provider = getProviderInstance('msg91');
    const sendResult = await provider.sendSMS({
      phoneNumber,
      message: interpolatedMessage,
      senderId: 'SEVKAA',
      dltTemplateId: effectiveDltId || undefined,
      variables
    });

    // Audit log: only log basic dispatch info, no DLT template ID saved to DB
    try {
      await supabaseAdmin.from('sms_audit_logs').insert({
        template_key: templateKey,
        provider: 'msg91',
        recipient_phone: phoneNumber,
        message: interpolatedMessage,
        variables: variables,
        dlt_template_id: null, // No template ID saved to DB
        sender_id: 'SEVKAA',
        status: sendResult.success ? 'success' : 'failed',
        error_message: sendResult.success ? null : sendResult.error,
        message_id: sendResult.messageId || null,
        sent_by: userId || null
      });
    } catch (logErr) {
      console.warn('[SMS Audit Log Notice]:', logErr);
    }

    return {
      success: sendResult.success,
      messageId: sendResult.messageId,
      error: sendResult.error,
      providerUsed: 'msg91'
    };
  }

  let activeTemplate: any = null;
  let providerUsed = 'msg91'; // MSG91 is the primary SMS provider

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
      // Always use msg91 regardless of what the DB template says for provider
      // (AWS credentials are SES/email-only — not configured for SNS SMS)
      providerUsed = 'msg91';
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
          providerUsed = 'msg91'; // Always msg91
        }
      }
    }

    // 2. Ultimate hardcoded fallbacks if DB lookup yielded nothing
    if (!activeTemplate) {
      const FALLBACK_TEMPLATES: Record<string, string> = {
        LOGIN_OTP: 'Your Sevikaa verification code is {{otp}}.\nValid for 10 minutes.\nDo not share this code with anyone.',
        OTP_VERIFICATION: 'Your Sevikaa verification code is {{otp}}.\nValid for 10 minutes.\nDo not share this code with anyone.',
        REGISTER_OTP: 'Welcome to Sevikaa.\nYour registration verification code is {{otp}}.\nValid for 10 minutes.',
        FORGOT_PASSWORD_OTP: 'Your Sevikaa password reset code is {{otp}}.\nValid for 10 minutes.',
        CHANGE_MOBILE_OTP: 'Verify your new mobile number on Sevikaa using OTP {{otp}}. Valid for 10 minutes. Team Sevikaa.',
        DELETE_ACCOUNT_OTP: 'Sevikaa: Your OTP to request account deletion is {{otp}}. Valid for 10 minutes. Do not share with anyone.',
        DOCUMENT_UPLOAD_LINK: 'Sevikaa: Upload selfie and Aadhaar card for account verification: {{url}}',
        JOB_APPLIED: 'Sevikaa Alert: Your job application for {{job_title}} has been submitted successfully.',
        JOB_ACCEPTED: 'Congratulations! Your application for {{job_title}} has been accepted by {{company}} on Sevikaa.',
        INTERVIEW_SCHEDULED: 'Interview scheduled on {{date}} at {{time}}.\nCheck Sevikaa for complete details.',
        WORKER_VERIFIED: 'Congratulations!\nYour Sevikaa profile has been verified successfully.',
        NEW_APPLICATION: 'Sevikaa: A new worker has applied for {{job_title}}. Login to review.',
        SEVKAA_ASSISTED_APPLICATION: 'Sevikaa: Verified candidate {{candidate_name}} applied for your {{job_title}} post. Tap link to review profile: {{url}}',
        ASSISTED_APPLICATION: 'Sevikaa: Verified candidate {{candidate_name}} applied for your {{job_title}} post. Tap link to review profile: {{url}}',
        SUBSCRIPTION_ACTIVATED: 'Your Sevikaa subscription {{plan_name}} is now active.\nThank you.',
        PAYMENT_SUCCESS: 'Sevikaa: Payment of Rs.{{amount}} received successfully. Transaction ID {{transaction_id}}. Thank you for using Sevikaa.',
        SECURITY_ALERT: 'A security-sensitive action was detected on your Sevikaa account.\nIf this wasn\'t you, contact support immediately.'
      };
      
      const fallbackMsg = FALLBACK_TEMPLATES[templateKey];
      if (!fallbackMsg) {
        throw new Error(`SMS template key "${templateKey}" not found in database or fallbacks.`);
      }
      activeTemplate = {
        template_key: templateKey,
        provider: 'msg91',
        sender_id: 'SEVKAA',
        message: fallbackMsg,
        dlt_template_id: null,
      };
      providerUsed = 'msg91';
    }

    // 4. Interpolate variables
    const interpolatedMessage = interpolateVariables(activeTemplate.message, variables);

    // 5. Validate variables
    const validation = validateTemplateVariables(activeTemplate.message, variables);
    if (!validation.valid) {
      throw new Error(`Template variable validation failed. Missing variables: ${validation.missing.join(', ')}`);
    }

    const envDltId = process.env[`MSG91_TEMPLATE_ID_${templateKey}`];
    const effectiveDltId = activeTemplate.dlt_template_id || 
                           (envDltId && !envDltId.includes('placeholder') ? envDltId : null) ||
                           (process.env.MSG91_TEMPLATE_ID && !process.env.MSG91_TEMPLATE_ID.includes('placeholder') ? process.env.MSG91_TEMPLATE_ID : null);

    // 6. Send using primary resolved provider
    let provider = getProviderInstance(providerUsed);
    let sendResult = await provider.sendSMS({
      phoneNumber,
      message: interpolatedMessage,
      senderId: activeTemplate.sender_id,
      dltTemplateId: effectiveDltId,
      variables
    });

    // 7. Log failure — no AWS fallback (AWS creds are SES/email only, not SNS)
    if (!sendResult.success) {
      console.warn(`[SMS] MSG91 failed for ${templateKey}: ${sendResult.error}`);
      // No further fallback — return failure so callers can handle gracefully
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
