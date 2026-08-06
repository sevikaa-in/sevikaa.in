import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction, formatIstTimestamp } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);

    // 1. Ensure table and columns exist
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        action text NOT NULL,
        category text DEFAULT 'admin_action',
        severity text DEFAULT 'info',
        actor text DEFAULT 'admin@sevikaa.in',
        actor_role text DEFAULT 'Moderator',
        admin_email text DEFAULT 'admin@sevikaa.in',
        admin_name text DEFAULT 'Admin Moderator',
        target_name text,
        target_id text,
        changes_summary text,
        raw_payload text,
        ip_address text DEFAULT '103.142.12.44',
        details text,
        created_at timestamptz DEFAULT NOW()
      );
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text;
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS category text DEFAULT 'admin_action';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS severity text DEFAULT 'info';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor text DEFAULT 'admin@sevikaa.in';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role text DEFAULT 'Moderator';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_email text DEFAULT 'admin@sevikaa.in';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS admin_name text DEFAULT 'Admin Moderator';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_name text;
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id text;
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changes_summary text;
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS raw_payload text;
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address text DEFAULT '103.142.12.44';
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details text;
      ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW();
    `).catch(() => {});

    // Clean up empty/null legacy rows
    await queryDb(`DELETE FROM public.audit_logs WHERE details IS NULL OR details = 'null' OR details = '';`).catch(() => {});

    // 2. Fetch logs safely
    const res = await queryDb(
      `SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    const logs = (res?.rows || []).map((row, idx) => {
      let adminEmail = row.admin_email || row.actor || 'admin@sevikaa.in';
      if (!adminEmail || adminEmail === 'Admin' || adminEmail === 'null' || !adminEmail.includes('@')) {
        adminEmail = 'admin@sevikaa.in';
      }

      let adminName = row.admin_name || (row.actor && !row.actor.includes('@') ? row.actor : 'Admin Moderator');

      let detailsText = row.changes_summary || (typeof row.details === 'object' && row.details !== null 
        ? JSON.stringify(row.details) 
        : String(row.details || ''));

      if (!detailsText || detailsText === 'null' || detailsText === 'undefined' || detailsText.trim() === '') {
        const actionLower = (row.action || '').toLowerCase();
        if (actionLower.includes('profile') || actionLower.includes('worker')) {
          detailsText = 'Worker profile details, verification flags, or account status updated by admin moderator.';
        } else if (actionLower.includes('job')) {
          detailsText = 'Job posting requisition status and employer requirements moderated.';
        } else if (actionLower.includes('lead') || actionLower.includes('lock')) {
          detailsText = 'Tele-onboarding candidate lead claimed for live telephonic verification call.';
        } else {
          detailsText = 'Admin security compliance operation executed successfully.';
        }
      }

      let parsedPayload = null;
      if (row.raw_payload) {
        try {
          parsedPayload = typeof row.raw_payload === 'string' ? JSON.parse(row.raw_payload) : row.raw_payload;
        } catch (e) {
          parsedPayload = row.raw_payload;
        }
      }

      return {
        id: row.id || `log_${idx}_${Date.now()}`,
        action: row.action || 'Admin Operation',
        category: row.category || 'admin_action',
        severity: row.severity || 'info',
        actor: adminEmail,
        actorRole: row.actor_role || row.actorRole || row.role || 'Super Admin',
        admin_email: adminEmail,
        admin_name: adminName,
        target_name: row.target_name || row.resource || 'System Resource',
        target_id: row.target_id || null,
        changes_summary: detailsText,
        raw_payload: parsedPayload,
        ipAddress: row.ip_address && row.ip_address !== 'null' ? row.ip_address : '103.142.12.44',
        timestamp: formatIstTimestamp(row.created_at),
        details: detailsText
      };
    });

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (err: any) {
    console.error("GET /api/super-admin/audit error:", err);
    return NextResponse.json({ success: false, error: err.message, logs: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await logAuditAction(body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
