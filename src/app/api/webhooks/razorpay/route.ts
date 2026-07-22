import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const isPlaceholder = !razorpaySecret || razorpaySecret.includes('placeholder');

    // 1. Verify Webhook Signature (If keys are configured)
    if (!isPlaceholder && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`[Razorpay Webhook] Received Event: ${event}`);

    // 2. Process Successful Charge Events
    if (event === 'payment.captured' || event === 'subscription.charged') {
      const paymentEntity = payload.payload.payment.entity;
      
      // Extract userId from notes metadata passed during checkout creation
      const userId = paymentEntity.notes?.userId || paymentEntity.notes?.user_id;
      const billingEmail = paymentEntity.email;

      if (!userId) {
        console.warn("[Razorpay Webhook] Webhook payment captured but no userId found in metadata notes.");
        return NextResponse.json({ received: true, warning: 'No userId in notes' });
      }

      // Check if DB connections are placeholder
      const isDbPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                             !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isDbPlaceholder) {
        console.log(`[Razorpay Webhook Mock] Upgrading user ${userId} to Premium status.`);
        return NextResponse.json({ received: true, mock: true });
      }

      // 3. Update database states with bypass role client
      // Update employer_profiles status to premium
      const { error: employerErr } = await supabaseAdmin
        .from('employer_profiles')
        .update({ subscription_status: 'premium' })
        .eq('user_id', userId);

      if (employerErr) {
        console.error("[Razorpay Webhook] Failed to update employer_profiles:", employerErr);
        throw employerErr;
      }

      // Sync audit logging history
      const { error: auditErr } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_id: userId,
          actor_role: 'system',
          action: `Upgrade to premium tier via Razorpay payment: ${paymentEntity.id}`
        });

      if (auditErr) {
        console.error("[Razorpay Webhook] Audit log entry failed:", auditErr);
      }

      console.log(`[Razorpay Webhook] Successfully upgraded user ${userId} to Premium subscription.`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Processing failed:", err);
    return NextResponse.json({ error: err.message || 'Webhook internal failure' }, { status: 500 });
  }
}
