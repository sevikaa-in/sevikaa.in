import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';
import { checkRateLimit, sanitizePayload } from '../../../../lib/adminSecurityGuard';
import { logSecurityAudit } from '../../../../lib/auditLogger';

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  if (!checkRateLimit(clientIp, 30, 60000)) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  try {
    const rawBody = await request.json();
    const { workerId, employerUserId } = sanitizePayload(rawBody);

    if (!workerId || !employerUserId) {
      return NextResponse.json({ error: 'Parameters workerId and employerUserId are required' }, { status: 400 });
    }

    // 1. Verify employer is premium
    const { data: ep, error: epErr } = await supabaseAdmin
      .from('employer_profiles')
      .select('id, subscription_status')
      .eq('user_id', employerUserId)
      .single();

    if (epErr || !ep) {
      await logSecurityAudit({
        userId: employerUserId,
        role: 'employer',
        action: 'UNLOCK_WORKER_CONTACT',
        resource: `Worker:${workerId}`,
        ipAddress: clientIp,
        status: 'FAILED',
        details: { reason: 'Employer profile not found' }
      });
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    if (ep.subscription_status !== 'premium') {
      await logSecurityAudit({
        userId: employerUserId,
        role: 'employer',
        action: 'UNLOCK_WORKER_CONTACT',
        resource: `Worker:${workerId}`,
        ipAddress: clientIp,
        status: 'DENIED',
        details: { reason: 'Free plan restriction' }
      });
      return NextResponse.json({ error: 'Premium subscription required to unlock candidate contact details' }, { status: 403 });
    }

    // 2. Register the unlock log
    const { error: unlockErr } = await supabaseAdmin
      .from('employer_unlocks')
      .upsert({
        employer_id: ep.id,
        worker_id: workerId
      }, { onConflict: 'employer_id, worker_id' });

    if (unlockErr) {
      return NextResponse.json({ error: 'Failed to record contact unlock' }, { status: 500 });
    }

    // 3. Fetch worker contact number securely
    const { data: worker, error: wErr } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('id', workerId)
      .single();

    if (wErr || !worker) {
      return NextResponse.json({ error: 'Worker contact number not found' }, { status: 404 });
    }

    await logSecurityAudit({
      userId: employerUserId,
      actorRole: 'Employer',
      category: 'employer_activity',
      action: 'Candidate Contact Unlocked',
      target_id: workerId,
      target_name: `Candidate ${workerId.slice(0, 8)}`,
      ipAddress: clientIp,
      changes_summary: `Employer unlocked candidate contact phone number (${worker.phone}).`
    }).catch(() => {});

    return NextResponse.json({ success: true, phone: worker.phone });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error processing candidate unlock' }, { status: 500 });
  }
}
