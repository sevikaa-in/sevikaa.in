import crypto from 'crypto';
import { TransactionRepository } from '@/repositories/transactionRepository';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { logAuditAction } from '@/lib/auditLogger';
import { queryDb } from '@/lib/db';

export interface RazorpayWebhookResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

export class PaymentService {
  static verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
    // P0 #17: Remove placeholder bypass — fail closed if secret is missing
    if (!secret) {
      console.error('[PaymentService] RAZORPAY_KEY_SECRET is not configured. Rejecting webhook.');
      return false;
    }
    if (!signature) {
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison prevents timing attacks
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const actualBuf = Buffer.from(signature.padEnd(expectedSignature.length, '0').slice(0, expectedSignature.length), 'hex');
    try {
      return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  static async processRazorpayEvent(payload: any): Promise<RazorpayWebhookResult> {
    const event = payload?.event;
    if (!event) {
      return { success: false, error: 'Invalid event payload', statusCode: 400 };
    }

    if (event === 'payment.captured' || event === 'subscription.charged' || event === 'payment.failed') {
      const paymentEntity = payload?.payload?.payment?.entity;
      if (!paymentEntity) {
        return { success: false, error: 'Missing payment entity', statusCode: 400 };
      }

      const paymentId = paymentEntity.id || `pay_${Date.now()}`;
      const orderId = paymentEntity.order_id || `order_${Date.now()}`;
      const status = event === 'payment.failed' ? 'failed' : (paymentEntity.status || 'captured');

      // P0 #5: Idempotency state machine check
      const eventId = `${event}:${paymentId}`;
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      try {
        const existingEvent = await queryDb(
          `SELECT processed_at FROM public.payment_events WHERE event_id = $1 LIMIT 1`,
          [eventId]
        );

        if (existingEvent?.rows?.length) {
          const row = existingEvent.rows[0];
          if (row.processed_at) {
            console.log(`[PaymentService] Idempotent skip: event ${eventId} already completed at ${row.processed_at}.`);
            return { success: true, message: 'Already processed' };
          }
          console.log(`[PaymentService] Retrying incomplete event ${eventId}...`);
        } else {
          await queryDb(
            `INSERT INTO public.payment_events (provider, event_id, payment_id, event_type, payload_hash, received_at)
             VALUES ('razorpay', $1, $2, $3, $4, NOW())
             ON CONFLICT (event_id) DO NOTHING`,
            [eventId, paymentId, event, payloadHash]
          );
        }
      } catch (idempotentErr: any) {
        console.error('[PaymentService] CRITICAL: payment_events idempotency check failed:', idempotentErr?.message);
        return { success: false, error: 'Idempotency verification failed. Deferred for retry.', statusCode: 500 };
      }

      const billingEmail = paymentEntity.email || 'employer@sevikaa.in';
      const billingPhone = paymentEntity.contact || 'N/A';
      const amount = (paymentEntity.amount || 0) / 100;
      const method = (paymentEntity.method || 'upi').toUpperCase();

      let userId: string;
      let planName = 'Premium Subscription Pass';

      // Fix #15: Authoritative lookup — cross-reference Razorpay order_id in checkout_sessions
      if (orderId && orderId.startsWith('order_')) {
        const sessionRes = await queryDb(
          `SELECT user_id, plan_id, expected_amount
           FROM public.checkout_sessions
           WHERE razorpay_order_id = $1
           LIMIT 1`,
          [orderId]
        ).catch(() => null);

        if (sessionRes?.rows?.length) {
          const session = sessionRes.rows[0];
          userId = session.user_id;
          planName = session.plan_id ? `${session.plan_id} plan` : planName;

          // Verify paid amount matches expected amount
          const expectedAmountPaise = (session.expected_amount || 0) * 100;
          const paidAmountPaise = paymentEntity.amount || 0;
          if (expectedAmountPaise > 0 && paidAmountPaise !== expectedAmountPaise) {
            console.error(`[PaymentService] AMOUNT MISMATCH: expected ${expectedAmountPaise} paise, got ${paidAmountPaise} paise for order ${orderId}`);
            await queryDb(
              `DELETE FROM public.payment_events WHERE event_id = $1`,
              [eventId]
            ).catch(() => {});
            return { success: false, error: 'Payment amount mismatch', statusCode: 400 };
          }
        } else {
          // Fix #15: Order not found in checkout_sessions — REJECT unmapped payments
          console.error(`[PaymentService] UNMAPPED PAYMENT REJECTED: No checkout_session found for order_id ${orderId}.`);
          await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [eventId]).catch(() => {});
          return { success: false, error: 'Unmapped payment order. Sent to manual reconciliation queue.', statusCode: 400 };
        }
      } else {
        // Fix #15: Missing valid order_id — REJECT payment
        console.error(`[PaymentService] UNMAPPED PAYMENT REJECTED: Missing valid order_id for payment ${paymentId}.`);
        await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [eventId]).catch(() => {});
        return { success: false, error: 'Payment order ID required.', statusCode: 400 };
      }

      // Record transaction
      await TransactionRepository.recordTransaction({
        id: paymentId,
        order_id: orderId,
        user_id: userId,
        employer_name: billingEmail.split('@')[0],
        employer_email: billingEmail,
        employer_phone: billingPhone,
        plan_name: planName,
        amount,
        payment_method: method,
        status,
        raw_payload: JSON.stringify(payload)
      });

      if (status === 'captured' && userId !== 'anonymous') {
        const { error: subErr } = await supabaseAdmin
          .from('employer_profiles')
          .update({ subscription_status: 'premium' })
          .eq('user_id', userId);

        if (subErr) {
          console.error('[PaymentService] CRITICAL: Subscription activation update failed for user:', userId, subErr);
          throw new Error(`Failed to activate subscription for user ${userId}: ${subErr.message}`);
        }

        // Mark event as fully processed ONLY after subscription update succeeds
        await queryDb(
          `UPDATE public.payment_events SET processed_at = NOW() WHERE event_id = $1`,
          [eventId]
        ).catch(() => {});
      } else {
        // Mark failed payment event as processed to prevent infinite webhook retries
        await queryDb(
          `UPDATE public.payment_events SET processed_at = NOW() WHERE event_id = $1`,
          [eventId]
        ).catch(() => {});
      }

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

    return { success: true };
  }
}
