import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { checkRateLimitCritical, extractClientIp } from '@/lib/rateLimiter';
import { sanitizePayload } from '@/lib/adminSecurityGuard';
import { logSecurityAudit } from '@/lib/auditLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function POST(request: NextRequest) {
  const clientIp = extractClientIp(request);

  const rateLimit = await checkRateLimitCritical(clientIp, 30, 60000);
  if (rateLimit.unavailable) {
    return NextResponse.json({ error: 'Rate limiting service temporarily unavailable.' }, { status: 503 });
  }
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  try {
    // Authenticate session via bearer token/cookie
    const authHeader = request.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      const sbCookie = Array.from(request.cookies.getAll()).find(c => 
        c.name.includes('auth-token') || c.name.includes('access-token') || c.name.endsWith('-auth-token')
      );
      if (sbCookie?.value) {
        try {
          const parsed = JSON.parse(sbCookie.value);
          token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null) || sbCookie.value;
        } catch {
          token = sbCookie.value;
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to unlock candidate contact details.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const employerUserId = user.id; // Derive strictly from verified token (IDOR Fix)
    const rawBody = await request.json();
    const { workerId } = sanitizePayload(rawBody);

    if (!workerId) {
      return NextResponse.json({ error: 'Parameter workerId is required' }, { status: 400 });
    }

    // 1. Verify employer is premium and account is approved
    const { data: ep, error: epErr } = await supabaseAdmin
      .from('employer_profiles')
      .select('id, subscription_status, status')
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

    if (ep.status === 'pending_review' || ep.status === 'onboarding_pending') {
      return NextResponse.json({ error: 'Forbidden', message: 'Employer profile is pending review and cannot perform unlock operations.' }, { status: 403 });
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

    // Check candidate worker profile status: pending_review candidates cannot have contacts unlocked
    const { data: candProf } = await supabaseAdmin
      .from('worker_profiles')
      .select('status')
      .or(`user_id.eq.${workerId},id.eq.${workerId}`)
      .maybeSingle();

    if (candProf && (candProf.status === 'pending_review' || candProf.status === 'onboarding_pending')) {
      return NextResponse.json({ error: 'Forbidden', message: 'Candidate profile is pending review and cannot be unlocked until approved.' }, { status: 403 });
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
      .select('phone, status')
      .eq('id', workerId)
      .single();

    if (wErr || !worker) {
      return NextResponse.json({ error: 'Worker contact number not found' }, { status: 404 });
    }

    if (worker.status === 'pending_review' || worker.status === 'onboarding_pending') {
      return NextResponse.json({ error: 'Forbidden', message: 'Candidate profile is pending review and cannot be unlocked until approved.' }, { status: 403 });
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
