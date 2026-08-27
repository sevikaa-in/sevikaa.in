import { queryDb } from '@/lib/db';

export interface AuditLogOptions {
  action: string;
  category?: 'admin_action' | 'auth_security' | 'moderation' | 'payment_webhook' | 'system_alert' | string;
  severity?: 'info' | 'warning' | 'critical' | string;
  actor?: string;
  actorRole?: 'Super Admin' | 'Moderator' | 'System Trigger' | 'Employer' | string;
  admin_email?: string;
  admin_name?: string;
  target_name?: string;
  target_id?: string;
  changes_summary?: string;
  raw_payload?: any;
  role?: string;
  resource?: string;
  ipAddress?: string;
  req?: any;
  details?: any;
  userId?: string;
  status?: string;
  userAgent?: string;
  [key: string]: any;
}

export function extractClientIp(req?: any): string {
  if (!req) return 'unknown';
  try {
    const forwarded = req.headers?.get ? req.headers.get('x-forwarded-for') : req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const firstIp = String(forwarded).split(',')[0].trim();
      if (firstIp && firstIp !== '::1' && firstIp !== '127.0.0.1') return firstIp;
    }
    const realIp = req.headers?.get ? req.headers.get('x-real-ip') : req.headers?.['x-real-ip'];
    if (realIp && realIp !== '::1' && realIp !== '127.0.0.1') return String(realIp).trim();
  } catch (e) {}
  return 'unknown';
}

const SENSITIVE_AUDIT_KEYS = new Set([
  'password', 'passcode', 'otp', 'token', 'access_token', 'refresh_token',
  'authorization', 'cookie', 'secret', 'api_key', 'aadhaar', 'aadhaar_number',
  'aadhaar_front_url', 'aadhaar_back_url', 'phone', 'mobile', 'email',
  'salary', 'expected_salary', 'address', 'document', 'selfie', 'profile_picture_url'
]);

export function sanitizeAuditPayload(payload: any): any {
  if (payload === null || payload === undefined) {
    return payload;
  }
  if (typeof payload !== 'object') {
    return payload;
  }
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizeAuditPayload(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_AUDIT_KEYS.has(keyLower) || Array.from(SENSITIVE_AUDIT_KEYS).some(k => keyLower.includes(k));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeAuditPayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizeAuditText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // 1. Contextual Transformations (preserves useful audit information without fabricated data)
  sanitized = sanitized.replace(/worker\s+phone\s+(changed|updated)\s+to\s+\+?\d+/gi, 'Worker contact information updated');
  sanitized = sanitized.replace(/expected\s+salary\s+(changed|updated)\s+to\s+₹?\d+/gi, 'expected salary updated');
  sanitized = sanitized.replace(/salary\s+(changed|updated)\s+to\s+₹?\d+/gi, 'salary updated');
  sanitized = sanitized.replace(/unlocked\s+(candidate\s+)?(contact\s+)?phone\s+number\s*\(\+?\d+\)/gi, 'unlocked candidate contact details');
  sanitized = sanitized.replace(/phone\s+number\s*\(\+?\d+\)/gi, 'contact details');

  // 2. Token, Authorization & Secret Redaction
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-_~+/=.]+/gi, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/eyJ[A-Za-z0-9\-_~+/=.]+\.[A-Za-z0-9\-_~+/=.]+\.[A-Za-z0-9\-_~+/=.]+/g, '[REDACTED_TOKEN]');

  // 3. Document, Selfie & Storage URL Redaction
  sanitized = sanitized.replace(/https?:\/\/[^\s"'\)>]+/gi, '[REDACTED_URL]');

  // 4. Phone Number Redaction: +91 9876543210 or 10-12 digit phone numbers
  sanitized = sanitized.replace(/(phone\s*(number)?\s*[:=]?\s*)\+?91[\s-]?\d{10}|\b\+?91[\s-]?\d{10}\b|\b\d{10}\b/gi, (match, prefix) => {
    return prefix ? `${prefix}[REDACTED_PHONE]` : '[REDACTED_PHONE]';
  });

  // 5. Aadhaar Number Redaction: 12-digit format
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_AADHAAR]');

  // 6. OTP & Passcode Redaction
  sanitized = sanitized.replace(/\b(otp|passcode|code)\s*[:=]?\s*\d{4,8}\b/gi, '$1: [REDACTED_OTP]');

  // 7. Password & Secret Redaction
  sanitized = sanitized.replace(/\b(password|secret|api_key)\s*[:=]?\s*\S+/gi, '$1: [REDACTED_SECRET]');

  // 8. Salary & Currency Redaction
  sanitized = sanitized.replace(/₹\s?\d+|\b(expected_salary|salary)\s*[:=]?\s*₹?\s?\d+/gi, (match) => {
    if (match.toLowerCase().includes('salary')) {
      const parts = match.split(/[:=]/);
      return `${parts[0]}: [REDACTED_SALARY]`;
    }
    return '[REDACTED_SALARY]';
  });

  return sanitized;
}

export async function logAuditAction(options: AuditLogOptions) {
  try {
    const {
      action,
      category = 'admin_action',
      severity = 'info',
      actor = 'Admin',
      actorRole,
      admin_email,
      admin_name,
      target_name,
      target_id,
      changes_summary,
      raw_payload,
      role,
      resource,
      ipAddress,
      req,
      details = '',
      userId
    } = options;

    const rawDetectedIp = ipAddress || extractClientIp(req);
    const detectedIp = (rawDetectedIp && rawDetectedIp !== 'null') ? rawDetectedIp : 'unknown';

    let detectedAdminEmail = admin_email || (actor && actor.includes('@') ? actor : null);
    let detectedAdminName = admin_name || (actor && !actor.includes('@') ? actor : null);

    if (req) {
      try {
        const authHeader = req.headers?.get ? req.headers.get('authorization') : null;
        const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;
        if (token) {
          const { decodeJwtPayload } = require('@/lib/jwtHelper');
          const decoded = decodeJwtPayload(token);
          if (decoded?.email && decoded.email.includes('@')) {
            detectedAdminEmail = decoded.email;
          }
          if (decoded?.name || decoded?.full_name) {
            detectedAdminName = decoded.name || decoded.full_name;
          }
        }
      } catch {}
    }

    if (!detectedAdminEmail && req) {
      try {
        const emailCookie = req.cookies?.get ? req.cookies.get('sevikaa_user_email')?.value : null;
        const userCookie = req.cookies?.get ? req.cookies.get('sevikaa_user')?.value : null;
        if (emailCookie && emailCookie.includes('@')) {
          detectedAdminEmail = emailCookie;
        } else if (userCookie) {
          const parsed = JSON.parse(decodeURIComponent(userCookie));
          if (parsed?.email && parsed.email.includes('@')) {
            detectedAdminEmail = parsed.email;
          }
          if (parsed?.name || parsed?.full_name) {
            detectedAdminName = parsed.name || parsed.full_name;
          }
        }
      } catch {}
    }

    const finalAdminEmail = detectedAdminEmail || null;
    const finalAdminName = detectedAdminName || (detectedAdminEmail && detectedAdminEmail.includes('@') ? detectedAdminEmail.split('@')[0] : null);
    const finalTargetName = sanitizeAuditText(target_name || resource || 'System Resource');
    const finalTargetId = (target_id || userId) ? String(target_id || userId) : null;

    const sanitizedDetails = typeof details === 'object' && details !== null 
      ? sanitizeAuditPayload(details) 
      : (typeof details === 'string' ? sanitizeAuditText(details) : details);

    const rawChangesSummary = changes_summary || (typeof details === 'string' ? details : JSON.stringify(sanitizedDetails));
    const finalChangesSummary = sanitizeAuditText(rawChangesSummary);

    const formattedDetails = typeof sanitizedDetails === 'object' && sanitizedDetails !== null 
      ? sanitizeAuditText(JSON.stringify(resource ? { ...sanitizedDetails, resource } : sanitizedDetails)) 
      : sanitizeAuditText(resource ? `${resource}: ${sanitizedDetails || ''}` : String(sanitizedDetails || ''));

    const sanitizedPayload = raw_payload ? sanitizeAuditPayload(raw_payload) : (typeof details === 'object' ? sanitizeAuditPayload(details) : null);
    const rawPayloadJson = sanitizedPayload ? sanitizeAuditText(JSON.stringify(sanitizedPayload)) : null;
    const finalRole = actorRole || role || 'Moderator';

    // audit_logs table managed via migrations — no runtime DDL or runtime DELETE operations

    // Insert Audit Event
    await queryDb(`
      INSERT INTO public.audit_logs 
        (action, category, severity, actor, actor_role, admin_email, admin_name, target_name, target_id, changes_summary, raw_payload, ip_address, details, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    `, [
      action, category, severity, 
      finalAdminEmail, finalRole, finalAdminEmail, finalAdminName,
      finalTargetName, finalTargetId, finalChangesSummary, rawPayloadJson,
      detectedIp, formattedDetails
    ]);

  } catch (err) {
    console.warn("Notice writing audit log:", err);
  }
}

export async function clearLegacyAuditLogs() {
  try {
    await queryDb(`TRUNCATE public.audit_logs;`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function formatIstTimestamp(dateInput?: string | Date | null): string {
  if (!dateInput) {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST';
  }
  try {
    const d = new Date(dateInput);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (e) {
    return String(dateInput);
  }
}

export const logSecurityAudit = logAuditAction;

export async function logDocumentAccess(actorId: string, actorEmail: string, role: string, documentRef: string, req?: any) {
  return logAuditAction({
    action: 'Document Signed Access',
    category: 'document_access',
    severity: 'info',
    actor: actorEmail || actorId,
    actorRole: role,
    target_name: documentRef,
    target_id: actorId,
    changes_summary: `Signed access URL issued to ${role} (${actorEmail || actorId}) for asset reference '${documentRef}'`,
    req
  });
}

