import { queryDb } from '@/lib/db';

export interface TransactionRecord {
  id?: string;
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  user_id: string;
  employer_name: string;
  employer_email: string;
  employer_phone: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  status: string;
  raw_payload?: string;
}

export class TransactionRepository {
  static async findTransactionByPaymentId(paymentId: string): Promise<TransactionRecord | null> {
    const res = await queryDb(
      `SELECT * FROM public.transactions WHERE razorpay_payment_id = $1 OR id::text = $1 LIMIT 1`,
      [paymentId]
    );
    return res?.rows?.[0] || null;
  }

  static async recordTransaction(data: TransactionRecord): Promise<boolean> {
    await queryDb(
      `INSERT INTO public.transactions 
         (razorpay_payment_id, razorpay_order_id, user_id, employer_name, employer_email, employer_phone, plan_name, amount, payment_method, status, raw_payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (razorpay_payment_id) DO UPDATE SET 
         status = EXCLUDED.status, 
         amount = EXCLUDED.amount,
         raw_payload = EXCLUDED.raw_payload;`,
      [
        data.razorpay_payment_id,
        data.razorpay_order_id || null,
        data.user_id,
        data.employer_name,
        data.employer_email,
        data.employer_phone,
        data.plan_name,
        data.amount,
        data.payment_method,
        data.status,
        data.raw_payload || null
      ]
    );

    return true;
  }
}
