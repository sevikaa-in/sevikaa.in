import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSecurityContext, sanitizePayload } from '../../../../lib/adminSecurityGuard';
import { logSecurityAudit } from '../../../../lib/auditLogger';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';

export async function POST(request: NextRequest) {
  // 1. Enforce Super Admin Role Verification
  const { context, errorResponse } = await verifyAdminSecurityContext(request, {
    requiredRole: 'super-admin'
  });

  if (errorResponse) return errorResponse;

  try {
    const rawBody = await request.json();
    const { targetUserId, newRole, newStatus } = sanitizePayload(rawBody);

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // 2. Prevent Self Demotion or Self Suspension by accident
    if (targetUserId === context?.userId && newRole && newRole !== 'super-admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super Admin cannot revoke their own Super Admin privileges.' },
        { status: 403 }
      );
    }

    // 3. Fetch Target User Profile
    const { data: targetProfile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status, email')
      .eq('id', targetUserId)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user profile not found' }, { status: 404 });
    }

    // 4. Build updates object
    const updatePayload: Record<string, any> = {};
    if (newRole && ['worker', 'employer', 'admin', 'super-admin'].includes(newRole)) {
      updatePayload.role = newRole;
    }
    if (newStatus && ['live', 'approved', 'pending_review', 'suspended', 'banned'].includes(newStatus)) {
      updatePayload.status = newStatus;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid role or status updates specified' }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', targetUserId);

    if (updateErr) {
      await logSecurityAudit({
        userId: context!.userId,
        role: context!.role,
        action: 'UPDATE_USER_ACCOUNT',
        resource: `User:${targetUserId}`,
        ipAddress: context!.ipAddress,
        userAgent: context!.userAgent,
        status: 'FAILED',
        details: { updatePayload, error: updateErr.message }
      });
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    await logSecurityAudit({
      userId: context!.userId,
      role: context!.role,
      action: 'UPDATE_USER_ACCOUNT',
      resource: `User:${targetUserId}`,
      ipAddress: context!.ipAddress,
      userAgent: context!.userAgent,
      status: 'SUCCESS',
      details: { previousRole: targetProfile.role, updatePayload }
    });

    return NextResponse.json({
      success: true,
      message: 'User account updated successfully',
      updatedFields: updatePayload
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error updating user account' }, { status: 500 });
  }
}
