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

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const actualBuf = Buffer.from(signature.padEnd(expectedSignature.length, '0').slice(0, expectedSignature.length), 'hex');
    try {
      return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  static async processRazorpayEvent(payload: any, options?: { webhookEventId?: string | null }): Promise<RazorpayWebhookResult> {
    const event = payload?.event;
    if (!event) {
      return { success: false, error: 'Invalid event payload', statusCode: 400 };
    }

    if (event === 'payment.captured' || event === 'subscription.charged' || event === 'payment.failed' || event === 'payment.refunded') {
      const paymentEntity = payload?.payload?.payment?.entity;
      if (!paymentEntity) {
        return { success: false, error: 'Missing payment entity', statusCode: 400 };
      }

      // Currency Integrity Check
      const currency = (paymentEntity.currency || 'INR').toUpperCase();
      if (currency !== 'INR') {
        console.error(`[PaymentService] CURRENCY MISMATCH: Expected INR, got ${currency}`);
        return { success: false, error: 'Invalid currency. Expected INR.', statusCode: 400 };
      }

      // 1. Strict Payment ID Validation (Zero Fallback Generation)
      const paymentId = paymentEntity.id;
      if (!paymentId || typeof paymentId !== 'string' || !paymentId.trim()) {
        console.error('[PaymentService] REJECTED: Missing payment ID in webhook payload.');
        return { success: false, error: 'Missing payment ID', statusCode: 400 };
      }

      // 2. Order ID and Subscription Identifier Resolution
      const subscriptionEntity = payload?.payload?.subscription?.entity;
      const subscriptionId: string | null = subscriptionEntity?.id || paymentEntity?.subscription_id || null;
      let orderId: string | null = paymentEntity.order_id || null;

      if (event !== 'subscription.charged') {
        if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
          console.error(`[PaymentService] REJECTED: Missing order ID in webhook payload for event ${event}.`);
          return { success: false, error: 'Missing order ID', statusCode: 400 };
        }
      }

      // 3. Strict Payment Amount Validation (Zero Defaulting Prevention)
      const rawAmount = paymentEntity.amount;
      if (
        rawAmount === null ||
        rawAmount === undefined ||
        typeof rawAmount !== 'number' ||
        !Number.isFinite(rawAmount) ||
        !Number.isInteger(rawAmount) ||
        rawAmount <= 0
      ) {
        console.error(`[PaymentService] REJECTED: Invalid or missing payment amount: ${rawAmount}`);
        return {
          success: false,
          error:
            rawAmount === null || rawAmount === undefined
              ? 'Missing payment amount'
              : !Number.isInteger(rawAmount)
              ? 'Invalid payment amount. Amount in paise must be an integer.'
              : 'Invalid payment amount',
          statusCode: 400
        };
      }
      const amount = rawAmount / 100;

      let status = event === 'payment.failed' ? 'failed' : (event === 'payment.refunded' ? 'refunded' : (paymentEntity.status || 'captured'));

      // Atomic Idempotency Claim: Attempt atomic database row claim
      const headerEventId = options?.webhookEventId || payload?.event_id;
      const refundId = payload?.payload?.refund?.entity?.id;
      const entityKey = (event === 'payment.refunded' && refundId) ? refundId : paymentId;
      const eventId = headerEventId || `${event}:${entityKey}`;
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      try {
        const claimRes = await queryDb(
          `INSERT INTO public.payment_events (provider, event_id, payment_id, event_type, payload_hash, received_at)
           VALUES ('razorpay', $1, $2, $3, $4, NOW())
           ON CONFLICT (event_id) DO NOTHING
           RETURNING event_id, processed_at`,
          [eventId, paymentId, event, payloadHash]
        );

        if (!claimRes?.rows?.length) {
          // Conflict occurred: another execution inserted event_id first
          const existing = await queryDb(
            `SELECT processed_at FROM public.payment_events WHERE event_id = $1 LIMIT 1`,
            [eventId]
          );

          if (existing?.rows?.length) {
            const row = existing.rows[0];
            if (row.processed_at) {
              console.log(`[PaymentService] Idempotent skip: event ${eventId} already completed at ${row.processed_at}.`);
              return { success: true, message: 'Already processed' };
            }

            // DO NOT RETURN SUCCESS FOR IN-PROGRESS CONCURRENT THREADS!
            // Return HTTP 500 so Razorpay retries if the active worker fails before completion.
            console.log(`[PaymentService] Event ${eventId} processing in progress or pending completion by concurrent thread.`);
            return {
              success: false,
              error: 'Event processing in progress or pending completion.',
              statusCode: 500
            };
          }
        }
      } catch (idempotentErr: any) {
        console.error('[PaymentService] CRITICAL: payment_events idempotency claim failed:', idempotentErr?.message);
        return { success: false, error: 'Idempotency verification failed. Deferred for retry.', statusCode: 500 };
      }

      const billingEmail = paymentEntity.email || 'employer@sevikaa.in';
      const billingPhone = paymentEntity.contact || 'N/A';
      const method = (paymentEntity.method || 'upi').toUpperCase();

      let userId: string = '';
      let planName = 'Premium Subscription Pass';

      // Authoritative lookup — cross-reference Razorpay order_id in checkout_sessions or fallback for subscription.charged
      let matchedSession: any = null;
      if (orderId) {
        const sessionRes = await queryDb(
          `SELECT user_id, plan_id, expected_amount
           FROM public.checkout_sessions
           WHERE razorpay_order_id = $1
           LIMIT 1`,
          [orderId]
        ).catch(() => null);

        if (sessionRes?.rows?.length) {
          matchedSession = sessionRes.rows[0];
        }
      }

      if (matchedSession) {
        const rawExpectedAmount = matchedSession.expected_amount;
        if (
          rawExpectedAmount === null ||
          rawExpectedAmount === undefined ||
          typeof rawExpectedAmount !== 'number' ||
          !Number.isFinite(rawExpectedAmount) ||
          rawExpectedAmount <= 0
        ) {
          console.error(`[PaymentService] REJECTED: Missing or invalid expected_amount in checkout session for order ${orderId}`);
          await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [eventId]).catch((err) => {
            console.error(`[PaymentService] Failed to cleanup event claim ${eventId}:`, err?.message);
          });
          return { success: false, error: 'Invalid or missing expected amount in checkout session', statusCode: 400 };
        }

        const expectedAmountPaise = Math.round(rawExpectedAmount * 100);
        if (rawAmount !== expectedAmountPaise) {
          console.error(`[PaymentService] AMOUNT MISMATCH: expected ${expectedAmountPaise} paise, got ${rawAmount} paise for order ${orderId}`);
          await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [eventId]).catch((err) => {
            console.error(`[PaymentService] Failed to cleanup event claim ${eventId}:`, err?.message);
          });
          return { success: false, error: 'Payment amount mismatch', statusCode: 400 };
        }

        userId = matchedSession.user_id;
        planName = matchedSession.plan_id ? `${matchedSession.plan_id} plan` : planName;
      } else if (event === 'subscription.charged' || (subscriptionEntity && subscriptionEntity.id)) {
        // Authoritative resolution for subscription.charged events where checkout_sessions row is unmapped
        const subNotesUserId = subscriptionEntity?.notes?.user_id || paymentEntity?.notes?.user_id;
        if (subNotesUserId && typeof subNotesUserId === 'string' && subNotesUserId.trim()) {
          userId = subNotesUserId.trim();
        } else {
          console.error(`[PaymentService] UNMAPPED SUBSCRIPTION REJECTED: Missing authoritative user_id metadata in subscription notes for payment ${paymentId}.`);
          await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [eventId]).catch((err) => {
            console.error(`[PaymentService] Failed to cleanup event claim ${eventId}:`, err?.message);
          });
          return { success: false, error: 'Unmapped subscription payment. Authoritative user reference missing in notes.', statusCode: 400 };
        }
        planName = subscriptionEntity?.plan_id ? `Subscription Plan (${subscriptionEntity.plan_id})` : planName;
      } else {
        console.error(`[PaymentService] UNMAPPED PAYMENT REJECTED: No checkout_session found for order_id ${orderId}.`);
        await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1`, [eventId]).catch((err) => {
          console.error(`[PaymentService] Failed to cleanup event claim ${eventId}:`, err?.message);
        });
        return { success: false, error: 'Unmapped payment order. Sent to manual reconciliation queue.', statusCode: 400 };
      }

      // Check existing transaction for state transition protection
      const existingTx = await TransactionRepository.findTransactionByPaymentId(paymentId);
      if (existingTx && !TransactionRepository.isValidStateTransition(existingTx.status, status)) {
        console.warn(`[PaymentService] Rejecting status regression: Transaction ${paymentId} is already ${existingTx.status}, requested ${status}`);
        status = existingTx.status; // Retain current status
      }

      try {
        // Record transaction with correct razorpay_payment_id & razorpay_order_id columns
        await TransactionRepository.recordTransaction({
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId || undefined,
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
        }

        // Mark event as fully processed after transaction & subscription updates succeed
        await queryDb(
          `UPDATE public.payment_events SET processed_at = NOW() WHERE event_id = $1`,
          [eventId]
        );
      } catch (procErr: any) {
        console.error('[PaymentService] CRITICAL: Financial processing or completion record failed:', procErr?.message);
        await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1 AND processed_at IS NULL`, [eventId]).catch(() => {});
        throw procErr;
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

    if (event === 'subscription.cancelled' || event === 'subscription.halted' || event === 'subscription.paused') {
      const subscriptionEntity = payload?.payload?.subscription?.entity;
      if (!subscriptionEntity) {
        return { success: false, error: 'Missing subscription entity', statusCode: 400 };
      }

      const subscriptionId = subscriptionEntity.id;
      if (!subscriptionId || typeof subscriptionId !== 'string' || !subscriptionId.trim()) {
        return { success: false, error: 'Missing subscription ID', statusCode: 400 };
      }

      const subNotesUserId = subscriptionEntity?.notes?.user_id;
      if (!subNotesUserId || typeof subNotesUserId !== 'string' || !subNotesUserId.trim()) {
        console.error(`[PaymentService] UNMAPPED SUBSCRIPTION CANCELLATION REJECTED: Missing user_id metadata notes in subscription ${subscriptionId}`);
        return { success: false, error: 'Unmapped subscription cancellation. Missing user reference in notes.', statusCode: 400 };
      }

      const userId = subNotesUserId.trim();
      const headerEventId = options?.webhookEventId || payload?.event_id;
      const eventId = headerEventId || `${event}:${subscriptionId}`;
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      try {
        const claimRes = await queryDb(
          `INSERT INTO public.payment_events (provider, event_id, payment_id, event_type, payload_hash, received_at)
           VALUES ('razorpay', $1, $2, $3, $4, NOW())
           ON CONFLICT (event_id) DO NOTHING
           RETURNING event_id, processed_at`,
          [eventId, subscriptionId, event, payloadHash]
        );

        if (!claimRes?.rows?.length) {
          const existing = await queryDb(
            `SELECT processed_at FROM public.payment_events WHERE event_id = $1 LIMIT 1`,
            [eventId]
          );

          if (existing?.rows?.length && existing.rows[0].processed_at) {
            return { success: true, message: 'Already processed' };
          }
        }

        const { error: subErr } = await supabaseAdmin
          .from('employer_profiles')
          .update({ subscription_status: 'free' })
          .eq('user_id', userId);

        if (subErr) {
          console.error('[PaymentService] CRITICAL: Subscription cancellation update failed for user:', userId, subErr);
          throw new Error(`Failed to cancel subscription for user ${userId}: ${subErr.message}`);
        }

        await queryDb(
          `UPDATE public.payment_events SET processed_at = NOW() WHERE event_id = $1`,
          [eventId]
        );

        logAuditAction({
          action: `Razorpay Subscription ${event.toUpperCase()}`,
          category: 'payment_webhook',
          severity: 'warning',
          actor: userId,
          actorRole: 'Employer',
          target_name: `Subscription ${subscriptionId}`,
          target_id: subscriptionId,
          changes_summary: `Subscription ${subscriptionId} status updated to FREE for user ${userId} due to ${event} event.`,
          raw_payload: payload
        }).catch(() => {});
      } catch (procErr: any) {
        console.error('[PaymentService] CRITICAL: Subscription cancellation processing failed:', procErr?.message);
        await queryDb(`DELETE FROM public.payment_events WHERE event_id = $1 AND processed_at IS NULL`, [eventId]).catch(() => {});
        throw procErr;
      }
    }

    return { success: true };
  }
}
