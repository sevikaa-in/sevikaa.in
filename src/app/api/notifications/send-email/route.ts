import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/notifications';
import { 
  getJobPostedEmailHtml, 
  getAccountDeletionRequestedEmailHtml,
  getNewCandidateApplicationEmailHtml,
  getInterviewScheduledEmailHtml,
  getSubscriptionActivatedEmailHtml,
  getPaymentReceiptEmailHtml
} from '@/lib/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, toEmail, data } = body;

    if (!toEmail) {
      return NextResponse.json({ error: 'Missing toEmail parameter' }, { status: 400 });
    }

    let subject = body.subject || 'Sevikaa Notification';
    let htmlBody = body.htmlBody || '';

    if (type === 'job-posted') {
      subject = `Job Requisition Submitted: ${data.jobTitle}`;
      htmlBody = getJobPostedEmailHtml(data);
    } else if (type === 'account-deletion') {
      subject = 'Sevikaa Account Closure Request Confirmation';
      htmlBody = getAccountDeletionRequestedEmailHtml(data);
    } else if (type === 'candidate-application') {
      subject = `New Applicant Alert: ${data.workerName} applied for ${data.jobTitle}`;
      htmlBody = getNewCandidateApplicationEmailHtml(data);
    } else if (type === 'interview-scheduled') {
      subject = `Interview Scheduled: ${data.workerName} (${data.workerRole})`;
      htmlBody = getInterviewScheduledEmailHtml(data);
    } else if (type === 'subscription-activated') {
      subject = `Plan Activated: ${data.planName}`;
      htmlBody = getSubscriptionActivatedEmailHtml(data);
    } else if (type === 'payment-receipt') {
      subject = `Payment Receipt: ${data.planName}`;
      htmlBody = getPaymentReceiptEmailHtml(data);
    }

    const res = await sendEmail(toEmail, subject, htmlBody);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("API send-email error:", err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch email' }, { status: 500 });
  }
}
