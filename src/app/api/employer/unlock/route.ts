import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';

export async function POST(request: NextRequest) {
  try {
    const { workerId, employerUserId } = await request.json();

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
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    if (ep.subscription_status !== 'premium') {
      return NextResponse.json({ error: 'Premium subscription required to unlock candidates' }, { status: 403 });
    }

    // 2. Register the unlock log (conflict ignored if already unlocked)
    const { error: unlockErr } = await supabaseAdmin
      .from('employer_unlocks')
      .upsert({
        employer_id: ep.id,
        worker_id: workerId
      }, { onConflict: 'employer_id, worker_id' });

    if (unlockErr) {
      console.error("[Unlock API] Upsert unlock failed:", unlockErr);
      return NextResponse.json({ error: 'Failed to record unlock' }, { status: 500 });
    }

    // 3. Securely fetch and return the worker's phone number from profiles table
    const { data: worker, error: wErr } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('id', workerId)
      .single();

    if (wErr || !worker) {
      return NextResponse.json({ error: 'Worker contact number not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, phone: worker.phone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server unlock failed' }, { status: 500 });
  }
}
