import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications';
import {
  getJobPostedEmailHtml,
  getAccountDeletionRequestedEmailHtml,
  getNewCandidateApplicationEmailHtml,
  getInterviewScheduledEmailHtml,
  getSubscriptionActivatedEmailHtml,
  getPaymentReceiptEmailHtml
} from '@/lib/emailTemplates';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ALLOWED_TYPES = new Set([
  'job-posted', 'account-deletion', 'candidate-application',
  'interview-scheduled', 'subscription-activated', 'payment-receipt'
]);

export async function POST(request: NextRequest) {
  try {
    // 1. Internal service secret (for server-side calls from other API routes)
    const internalSecret = process.env.INTERNAL_API_SECRET || '';
    const secretHeader = request.headers.get('x-internal-secret') || '';
    const isInternalCall = internalSecret && secretHeader === internalSecret;

    // 2. If not an internal call, require admin authentication
    if (!isInternalCall) {
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
          } catch { token = sbCookie.value; }
        }
      }

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to send emails.' }, { status: 401 });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !user) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const isAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden', message: 'Admin privileges required to send emails.' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { type, toEmail, data } = body;

    // 3. Validate allowed types — never pass through freeform htmlBody from external callers
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: `Invalid notification type: ${type}` }, { status: 400 });
    }

    if (!toEmail) {
      return NextResponse.json({ error: 'Missing toEmail parameter' }, { status: 400 });
    }

    let subject = 'Sevikaa Notification';
    let htmlBody = '';

    if (type === 'job-posted') {
      subject = `Job Requisition Submitted: ${data?.jobTitle}`;
      htmlBody = getJobPostedEmailHtml(data);
    } else if (type === 'account-deletion') {
      subject = 'Sevikaa Account Closure Request Confirmation';
      htmlBody = getAccountDeletionRequestedEmailHtml(data);
    } else if (type === 'candidate-application') {
      subject = `New Applicant Alert: ${data?.workerName} applied for ${data?.jobTitle}`;
      htmlBody = getNewCandidateApplicationEmailHtml(data);
    } else if (type === 'interview-scheduled') {
      subject = `Interview Scheduled: ${data?.workerName} (${data?.workerRole})`;
      htmlBody = getInterviewScheduledEmailHtml(data);
    } else if (type === 'subscription-activated') {
      subject = `Plan Activated: ${data?.planName}`;
      htmlBody = getSubscriptionActivatedEmailHtml(data);
    } else if (type === 'payment-receipt') {
      subject = `Payment Receipt: ${data?.planName}`;
      htmlBody = getPaymentReceiptEmailHtml(data);
    }

    const res = await sendEmail(toEmail, subject, htmlBody);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("API send-email error:", err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch email' }, { status: 500 });
  }
}
