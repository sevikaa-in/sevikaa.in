import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';
import { logAuditAction } from '../../../../lib/auditLogger';
import { queryDb } from '../../../../lib/db';

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

    // Ensure public.transactions table exists in PostgreSQL
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.transactions (
        id text PRIMARY KEY,
        order_id text,
        user_id text,
        employer_name text,
        employer_email text,
        employer_phone text,
        plan_name text NOT NULL DEFAULT 'Premium Subscription Pass',
        amount numeric NOT NULL DEFAULT 0,
        payment_method text DEFAULT 'UPI / Razorpay',
        status text NOT NULL DEFAULT 'captured',
        raw_payload text,
        created_at timestamptz DEFAULT NOW()
      );
    `).catch(() => {});

    // 2. Process Successful Charge Events
    if (event === 'payment.captured' || event === 'subscription.charged' || event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity;
      
      const userId = paymentEntity.notes?.userId || paymentEntity.notes?.user_id || 'anonymous';
      const billingEmail = paymentEntity.email || 'employer@sevikaa.in';
      const billingPhone = paymentEntity.contact || 'N/A';
      const planName = paymentEntity.notes?.planName || 'Premium Subscription Pass';
      const paymentId = paymentEntity.id || `pay_${Date.now()}`;
      const orderId = paymentEntity.order_id || `order_${Date.now()}`;
      const amount = (paymentEntity.amount || 0) / 100;
      const method = (paymentEntity.method || 'upi').toUpperCase();
      const status = event === 'payment.failed' ? 'failed' : (paymentEntity.status || 'captured');

      // Record transaction row into PostgreSQL
      await queryDb(`
        INSERT INTO public.transactions (id, order_id, user_id, employer_name, employer_email, employer_phone, plan_name, amount, payment_method, status, raw_payload, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount;
      `, [paymentId, orderId, userId, billingEmail.split('@')[0], billingEmail, billingPhone, planName, amount, method, status, JSON.stringify(payload)]).catch(() => {});

      if (status === 'captured') {
        // Upgrade employer profile status
        await supabaseAdmin
          .from('employer_profiles')
          .update({ subscription_status: 'premium' })
          .eq('user_id', userId);
      }

      // Security Audit Logging
      logAuditAction({
        action: `Razorpay Payment ${status.toUpperCase()}`,
        category: 'payment_webhook',
        severity: status === 'failed' ? 'warning' : 'info',
        actor: billingEmail || userId,
        actorRole: 'Employer',
        target_name: `Transaction ${paymentId}`,
        target_id: paymentId,
        changes_summary: `${status.toUpperCase()} payment of ₹${amount.toFixed(2)} (${planName}) via ${method}. Payment ID: ${paymentId}`,
        raw_payload: payload
      }).catch(() => {});
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Processing failed:", err);
    return NextResponse.json({ error: err.message || 'Webhook internal failure' }, { status: 500 });
  }
}
