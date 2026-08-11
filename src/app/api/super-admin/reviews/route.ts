import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { formatIstTimestamp, logAuditAction } from '@/lib/auditLogger';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(request, { requiredRole: 'super-admin' });
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    // Item 30: reviews table created in migration 20260810000004 — no runtime DDL

    let queryStr = `SELECT * FROM public.reviews`;
    const params: any[] = [];

    if (statusFilter !== 'all') {
      queryStr += ` WHERE status = $1`;
      params.push(statusFilter);
    }

    queryStr += ` ORDER BY created_at DESC;`;

    const res = await queryDb(queryStr, params);

    const reviews = (res?.rows || []).map((r, idx) => ({
      id: r.id || `rev_${idx}`,
      interview_id: r.interview_id || null,
      reviewer_id: r.reviewer_id || 'N/A',
      reviewer_name: r.reviewer_name || 'User',
      reviewer_role: r.reviewer_role || 'employer',
      reviewee_id: r.reviewee_id || 'N/A',
      reviewee_name: r.reviewee_name || 'Target',
      reviewee_role: r.reviewee_role || 'worker',
      interaction_type: r.interaction_type || (r.interaction_type === 'worked' ? 'worked_together' : 'interview_impression'),
      rating: r.rating || 5,
      categories: typeof r.categories === 'string' ? JSON.parse(r.categories) : (r.categories || {}),
      comment: r.comment || '',
      status: r.status || 'pending',
      timestamp: formatIstTimestamp(r.created_at)
    }));

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error("GET /api/super-admin/reviews error:", err);
    return NextResponse.json({ success: false, error: err.message, reviews: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(request, { requiredRole: 'super-admin' });
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { reviewId, status, adminEmail } = body;

    if (!reviewId || !status) {
      return NextResponse.json({ error: 'Missing reviewId or status' }, { status: 400 });
    }

    const res = await queryDb(
      `UPDATE public.reviews SET status = $1 WHERE id = $2 RETURNING *;`,
      [status, reviewId]
    );

    const updatedReview = res?.rows?.[0];

    // Log security/moderation audit entry in IST format
    logAuditAction({
      action: `Review Moderation ${status.toUpperCase()}`,
      category: 'admin_action',
      severity: status === 'approved' ? 'info' : 'warning',
      actor: adminEmail || 'superadmin@sevikaa.in',
      actorRole: 'Super Admin',
      target_name: updatedReview?.reviewee_name || 'User Review',
      target_id: reviewId,
      changes_summary: `Super Admin ${status.toUpperCase()} rating review by ${updatedReview?.reviewer_name || 'User'} for ${updatedReview?.reviewee_name || 'Target'}. Stage: ${updatedReview?.interaction_type || 'interview_impression'}.`,
      raw_payload: body
    }).catch(() => {});

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (err: any) {
    console.error("POST /api/super-admin/reviews error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
