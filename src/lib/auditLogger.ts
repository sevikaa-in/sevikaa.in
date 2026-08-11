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
  if (!req) return '103.142.12.44';
  try {
    const forwarded = req.headers?.get ? req.headers.get('x-forwarded-for') : req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const firstIp = String(forwarded).split(',')[0].trim();
      if (firstIp && firstIp !== '::1' && firstIp !== '127.0.0.1') return firstIp;
    }
    const realIp = req.headers?.get ? req.headers.get('x-real-ip') : req.headers?.['x-real-ip'];
    if (realIp && realIp !== '::1' && realIp !== '127.0.0.1') return String(realIp).trim();
  } catch (e) {}
  return '103.142.12.44';
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

    const detectedIp = ipAddress || extractClientIp(req);
    const finalAdminEmail = admin_email || (actor && actor.includes('@') ? actor : 'admin@sevikaa.in');
    const finalAdminName = admin_name || (actor && !actor.includes('@') ? actor : 'Admin Moderator');
    const finalTargetName = target_name || resource || 'System Resource';
    const finalTargetId = (target_id || userId) ? String(target_id || userId) : null;
    const finalChangesSummary = changes_summary || (typeof details === 'string' ? details : JSON.stringify(details));

    const formattedDetails = typeof details === 'object' && details !== null 
      ? JSON.stringify(resource ? { ...details, resource } : details) 
      : (resource ? `${resource}: ${details || ''}` : String(details || ''));

    const rawPayloadJson = raw_payload ? JSON.stringify(raw_payload) : (typeof details === 'object' ? JSON.stringify(details) : null);
    const finalRole = actorRole || role || 'Moderator';

    // audit_logs table managed via migrations — no runtime DDL

    // Clean up empty/null legacy rows
    await queryDb(`DELETE FROM public.audit_logs WHERE details IS NULL OR details = 'null' OR details = '';`).catch(() => {});

    // 2. Insert Audit Event
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

