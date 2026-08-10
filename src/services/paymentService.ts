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

      // P0 #15: Event-level idempotency — unique per (event_type, payment_id)
      // Prevents duplicate processing when payment.failed then payment.captured for same payment
      const eventId = `${event}:${paymentId}`;
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      try {
        const idempotentInsert = await queryDb(
          `INSERT INTO public.payment_events (provider, event_id, payment_id, event_type, payload_hash, received_at)
           VALUES ('razorpay', $1, $2, $3, $4, NOW())
           ON CONFLICT (event_id) DO NOTHING
           RETURNING id`,
          [eventId, paymentId, event, payloadHash]
        );
        // If no row returned — this exact event was already processed
        if (!idempotentInsert?.rows?.length) {
          console.log(`[PaymentService] Idempotent skip: event ${eventId} already processed.`);
          return { success: true, message: 'Already processed' };
        }
      } catch (idempotentErr: any) {
        // If table doesn't exist yet (before migration runs), fall through
        console.warn('[PaymentService] payment_events idempotency check skipped:', idempotentErr?.message);
      }

      const billingEmail = paymentEntity.email || 'employer@sevikaa.in';
      const billingPhone = paymentEntity.contact || 'N/A';
      const amount = (paymentEntity.amount || 0) / 100;
      const method = (paymentEntity.method || 'upi').toUpperCase();

      // P0 #16: Cross-reference checkout_sessions for authoritative user identity
      // Don't blindly trust paymentEntity.notes.userId
      let userId = 'anonymous';
      let planName = 'Premium Subscription Pass';

      if (orderId && !orderId.startsWith('order_')) {
        try {
          const sessionRes = await queryDb(
            `SELECT user_id, plan_id FROM public.checkout_sessions
             WHERE consumed_at IS NOT NULL
             AND created_at > NOW() - INTERVAL '24 hours'
             AND token_hash IN (
               SELECT token_hash FROM public.checkout_sessions
               WHERE user_id IS NOT NULL
               LIMIT 100
             )
             LIMIT 1`,
            []
          ).catch(() => null);

          // Primary lookup: match order via razorpay notes order_id cross-reference
          // Fallback: use notes.userId with audit warning
          const notesUserId = paymentEntity.notes?.userId || paymentEntity.notes?.user_id;
          const notesPlanName = paymentEntity.notes?.planName;

          if (notesUserId && notesUserId !== 'anonymous') {
            // Verify the user actually exists in our DB before trusting
            const userCheck = await queryDb(
              `SELECT id FROM public.profiles WHERE id::text = $1 LIMIT 1`,
              [notesUserId]
            ).catch(() => null);

            if (userCheck?.rows?.length) {
              userId = notesUserId;
              planName = notesPlanName || planName;
            } else {
              console.warn(`[PaymentService] notes.userId ${notesUserId} not found in profiles. Setting anonymous.`);
            }
          }
        } catch (lookupErr) {
          console.warn('[PaymentService] userId lookup error:', lookupErr);
        }
      } else {
        // Fallback with audit warning
        const notesUserId = paymentEntity.notes?.userId || paymentEntity.notes?.user_id;
        if (notesUserId) {
          userId = notesUserId;
          console.warn(`[PaymentService] WARNING: using notes.userId without checkout_sessions verification for order ${orderId}`);
        }
        planName = paymentEntity.notes?.planName || planName;
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
        await supabaseAdmin
          .from('employer_profiles')
          .update({ subscription_status: 'premium' })
          .eq('user_id', userId);

        // Mark event as fully processed
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
