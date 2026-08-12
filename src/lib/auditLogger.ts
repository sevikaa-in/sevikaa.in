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
    const finalAdminEmail = admin_email || (actor && actor.includes('@') ? actor : 'admin@sevikaa.in');
    const finalAdminName = admin_name || (actor && !actor.includes('@') ? actor : 'Admin Moderator');
    const finalTargetName = target_name || resource || 'System Resource';
    const finalTargetId = (target_id || userId) ? String(target_id || userId) : null;
    const finalChangesSummary = changes_summary || (typeof details === 'string' ? details : JSON.stringify(sanitizeAuditPayload(details)));

    const sanitizedDetails = typeof details === 'object' && details !== null ? sanitizeAuditPayload(details) : details;
    const formattedDetails = typeof sanitizedDetails === 'object' && sanitizedDetails !== null 
      ? JSON.stringify(resource ? { ...sanitizedDetails, resource } : sanitizedDetails) 
      : (resource ? `${resource}: ${sanitizedDetails || ''}` : String(sanitizedDetails || ''));

    const sanitizedPayload = raw_payload ? sanitizeAuditPayload(raw_payload) : (typeof details === 'object' ? sanitizeAuditPayload(details) : null);
    const rawPayloadJson = sanitizedPayload ? JSON.stringify(sanitizedPayload) : null;
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

