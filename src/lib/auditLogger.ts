import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export interface AuditLogEntry {
  userId: string;
  role: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  details?: Record<string, any>;
}

/**
 * Enterprise Audit Logger for Recording Sensitive Security & Moderation Operations
 */
export async function logSecurityAudit(entry: AuditLogEntry): Promise<void> {
  const timestamp = new Date().toISOString();

  // Print structured audit log output for server monitoring
  console.log(`[AUDIT_LOG] [${timestamp}] [${entry.status}] User: ${entry.userId} (${entry.role}) | Action: ${entry.action} | Resource: ${entry.resource} | IP: ${entry.ipAddress || 'N/A'}`);

  if (supabaseUrl.includes('placeholder')) {
    return; // Sandbox mode fallback
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      role: entry.role,
      action: entry.action,
      resource: entry.resource,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      status: entry.status,
      details: entry.details ? JSON.stringify(entry.details) : null,
      created_at: timestamp
    });
  } catch (err: any) {
    console.error("[Audit Logger Error] Failed to persist audit entry:", err?.message || err);
  }
}
