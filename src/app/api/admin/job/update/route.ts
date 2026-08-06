import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, admin_note, admin_name, admin_email } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    const cleanStatus = status === 'approve' || status === 'approved' || status === 'live' ? 'active' 
      : status === 'reject' ? 'rejected' 
      : status === 'request_changes' ? 'changes_requested' 
      : status === 'unapprove' || status === 'revert' ? 'pending' 
      : status;

    const res = await queryDb(
      `UPDATE public.jobs 
       SET status = $1, 
           updated_at = NOW()
       WHERE id::text = $2::text OR user_id::text = $2::text
       RETURNING *`,
      [cleanStatus, id]
    );

    const updatedJob = res?.rows?.[0];
    const jobTitle = updatedJob?.title || updatedJob?.category || `Job Requisition #${id.slice(0, 8)}`;
    const summaryText = `Job status updated to '${cleanStatus.toUpperCase()}'. ${admin_note ? `Audit Note: "${admin_note}"` : ''}`;

    // Log Audit Event
    logAuditAction({
      action: `Job Requisition ${cleanStatus.toUpperCase()}`,
      category: 'moderation',
      severity: cleanStatus === 'active' ? 'info' : 'warning',
      actor: admin_email || admin_name || 'admin@sevikaa.in',
      admin_email: admin_email || 'admin@sevikaa.in',
      admin_name: admin_name || 'Admin Moderator',
      actorRole: 'Moderator',
      target_name: jobTitle,
      target_id: id,
      changes_summary: summaryText,
      details: summaryText,
      raw_payload: body
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      status: cleanStatus,
      job: updatedJob || null
    });
  } catch (error: any) {
    console.error("POST /api/admin/job/update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
