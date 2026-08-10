import crypto from 'crypto';
import { TransactionRepository } from '@/repositories/transactionRepository';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { logAuditAction } from '@/lib/auditLogger';

export interface RazorpayWebhookResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

export class PaymentService {
  static verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
    if (!secret || secret.includes('placeholder')) {
      return true; // Dev sandbox bypass
    }
    if (!signature) {
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
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

      const userId = paymentEntity.notes?.userId || paymentEntity.notes?.user_id || 'anonymous';
      const billingEmail = paymentEntity.email || 'employer@sevikaa.in';
      const billingPhone = paymentEntity.contact || 'N/A';
      const planName = paymentEntity.notes?.planName || 'Premium Subscription Pass';
      const paymentId = paymentEntity.id || `pay_${Date.now()}`;
      const orderId = paymentEntity.order_id || `order_${Date.now()}`;
      const amount = (paymentEntity.amount || 0) / 100;
      const method = (paymentEntity.method || 'upi').toUpperCase();
      const status = event === 'payment.failed' ? 'failed' : (paymentEntity.status || 'captured');

      // Idempotency Check: Avoid re-processing duplicate webhook deliveries
      const existingTx = await TransactionRepository.findTransactionById(paymentId);
      if (existingTx && existingTx.status === status) {
        console.log(`[PaymentService] Idempotent skip: Payment ${paymentId} already recorded with status ${status}`);
        return { success: true, message: 'Already processed' };
      }

      // Record transaction via repository
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
        // Upgrade employer profile subscription
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

    return { success: true };
  }
}
