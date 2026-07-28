import { supabase } from '@/lib/supabaseClient';

export interface AuditLogPayload {
  adminId?: string;
  adminEmail?: string;
  action: string;
  targetType?: 'job' | 'worker' | 'employer' | 'society' | 'system' | string;
  targetId?: string;
  details?: string | Record<string, any>;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  [key: string]: any;
}

export async function logSecurityAudit(
  actionOrPayload: string | Record<string, any>, 
  details?: any, 
  severity = 'LOW'
) {
  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                        !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (isPlaceholder) return;

  try {
    const actionStr = typeof actionOrPayload === 'string' 
      ? actionOrPayload 
      : (actionOrPayload?.action || 'SECURITY_AUDIT_EVENT');
    
    const detailsVal = typeof actionOrPayload === 'object' 
      ? JSON.stringify(actionOrPayload) 
      : typeof details === 'object' 
        ? JSON.stringify(details) 
        : String(details || '');

    const sevVal = (typeof actionOrPayload === 'object' && actionOrPayload?.severity) 
      ? actionOrPayload.severity 
      : severity;

    await supabase.from('audit_logs').insert([{
      action: actionStr,
      details: detailsVal,
      severity: sevVal,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error("Security audit log error:", err);
  }
}

export async function logAdminAuditAction(payload: AuditLogPayload) {
  return logSecurityAudit(payload);
}
