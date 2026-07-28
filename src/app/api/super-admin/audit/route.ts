import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSecurityContext } from '../../../../lib/adminSecurityGuard';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';

export async function GET(request: NextRequest) {
  // 1. Enforce Super Admin Role Verification
  const { context, errorResponse } = await verifyAdminSecurityContext(request, {
    requiredRole: 'super-admin'
  });

  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Failed to retrieve audit log ledger' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: logs || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error fetching audit log ledger' }, { status: 500 });
  }
}
