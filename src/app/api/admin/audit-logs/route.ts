import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function GET(req: NextRequest) {
  const { errorResponse, context } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200);
    const onlyMine = searchParams.get('onlyMine') === 'true';

    // Ensure audit_logs table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        category TEXT DEFAULT 'admin_action',
        severity TEXT DEFAULT 'info',
        actor TEXT,
        admin_email TEXT,
        admin_name TEXT,
        target_name TEXT,
        target_id TEXT,
        changes_summary TEXT,
        raw_payload JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `, []).catch(() => null);

    let query = `
      SELECT id, action, category, severity, actor, admin_email, admin_name, target_name, target_id, changes_summary, created_at 
      FROM public.audit_logs
    `;
    const params: any[] = [];

    if (onlyMine && (context?.email || context?.userId)) {
      query += ` WHERE admin_email = $1 OR actor = $1 OR actor = $2 `;
      params.push(context.email || context.userId, context.email ? context.email.split('@')[0] : context.userId);
      query += ` ORDER BY created_at DESC LIMIT $3`;
      params.push(limit);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1`;
      params.push(limit);
    }

    const res = await queryDb(query, params);

    const logs = (res?.rows || []).map((row: any) => ({
      id: row.id,
      action: row.action || 'System Audit Event',
      category: row.category || 'admin_action',
      severity: row.severity || 'info',
      actor_name: row.admin_name || row.actor || 'Operations Admin',
      actor_email: row.admin_email || 'admin@sevikaa.in',
      target: row.target_name || row.changes_summary || 'System Resource',
      time: new Date(row.created_at || Date.now()).getTime(),
      created_at: row.created_at
    }));

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error("Fetch admin audit logs API error:", err);
    return NextResponse.json({ success: false, logs: [] });
  }
}
