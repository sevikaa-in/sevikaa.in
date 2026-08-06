import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { id, status, admin_note } = await req.json();

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

    return NextResponse.json({
      success: true,
      status: cleanStatus,
      job: res?.rows?.[0] || null
    });
  } catch (error: any) {
    console.error("POST /api/admin/job/update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
