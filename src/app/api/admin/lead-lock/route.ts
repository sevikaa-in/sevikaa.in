import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

// Item 30: lead_locks table created in migration 20260810000004 — no runtime DDL

// GET: Return all active lead locks (where expires_at > NOW())
export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    const res = await queryDb(
      `SELECT lead_id, admin_id, admin_name, locked_at, expires_at 
       FROM public.lead_locks 
       WHERE expires_at > NOW()`
    );
    return NextResponse.json({
      success: true,
      locks: res?.rows || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Acquire or heartbeat renew a lead lock (expires in 2 minutes)
export async function POST(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;
  // Item 30: lead_locks table managed by migration — no runtime DDL
  try {
    const body = await req.json();
    const { lead_id, admin_id, admin_name } = body;

    if (!lead_id || !admin_id) {
      return NextResponse.json({ success: false, error: "lead_id and admin_id are required" }, { status: 400 });
    }

    const nameToUse = admin_name || "Admin";

    // 1. Check if lead is locked by ANOTHER admin (and lock is still active)
    const existing = await queryDb(
      `SELECT * FROM public.lead_locks WHERE lead_id = $1 AND expires_at > NOW()`,
      [lead_id]
    );

    if (existing?.rows?.[0]) {
      const lock = existing.rows[0];
      if (lock.admin_id !== admin_id) {
        return NextResponse.json({
          success: true,
          locked: true,
          locked_by_me: false,
          locked_by_admin_id: lock.admin_id,
          locked_by_admin_name: lock.admin_name,
          expires_at: lock.expires_at
        });
      }
    }

    // 2. Upsert lock for current admin with 2-minute expiration
    await queryDb(
      `INSERT INTO public.lead_locks (lead_id, admin_id, admin_name, locked_at, expires_at)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '2 minutes')
       ON CONFLICT (lead_id) 
       DO UPDATE SET admin_id = EXCLUDED.admin_id, admin_name = EXCLUDED.admin_name, locked_at = NOW(), expires_at = NOW() + INTERVAL '2 minutes'`,
      [lead_id, admin_id, nameToUse]
    );

    return NextResponse.json({
      success: true,
      locked: true,
      locked_by_me: true,
      locked_by_admin_id: admin_id,
      locked_by_admin_name: nameToUse,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Release lead lock
export async function DELETE(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  // Item 30: lead_locks table managed by migration — no runtime DDL
  try {
    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get('lead_id');
    const admin_id = searchParams.get('admin_id');

    if (!lead_id) {
      return NextResponse.json({ success: false, error: "lead_id is required" }, { status: 400 });
    }

    if (admin_id) {
      await queryDb(
        `DELETE FROM public.lead_locks WHERE lead_id = $1 AND admin_id = $2`,
        [lead_id, admin_id]
      );
    } else {
      await queryDb(
        `DELETE FROM public.lead_locks WHERE lead_id = $1`,
        [lead_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
