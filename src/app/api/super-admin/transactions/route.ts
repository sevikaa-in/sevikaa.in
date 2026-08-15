import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { formatIstTimestamp } from '@/lib/auditLogger';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function GET(request: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(request, { requiredRole: 'super-admin' });
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    // Get Total Count from DB (Fail closed with HTTP 503 if DB is unavailable)
    let countRes: any;
    try {
      countRes = await queryDb(`SELECT COUNT(*) FROM public.transactions;`);
    } catch (dbErr: any) {
      console.error("GET /api/super-admin/transactions DB query error:", dbErr);
      return NextResponse.json({ error: 'Service Unavailable', message: 'Transactions database is currently unavailable.' }, { status: 503 });
    }

    if (!countRes || !countRes.rows) {
      return NextResponse.json({ error: 'Service Unavailable', message: 'Transactions database query failed.' }, { status: 503 });
    }

    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    if (total === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        page,
        totalPages: 1,
        transactions: []
      });
    }

    const res = await queryDb(
      `SELECT id, razorpay_payment_id, razorpay_order_id, order_id, user_id, employer_name, employer_email, employer_phone, plan_name, amount, payment_method, status, invoice_number, created_at 
       FROM public.transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const transactions = (res?.rows || []).map((t, idx) => {
      const seqNum = total - (offset + idx);
      const defaultInv = `SV/26-27/${String(Math.max(1, seqNum)).padStart(4, '0')}`;
      const paymentId = t.razorpay_payment_id || t.id;
      const orderId = t.razorpay_order_id || t.order_id || `order_${idx}`;

      return {
        id: paymentId,
        orderId,
        employerName: t.employer_name || t.employer_email?.split('@')?.[0] || 'Employer Requisition',
        employerPhone: t.employer_phone || t.employer_email || 'N/A',
        planName: t.plan_name || 'Premium Pass',
        amount: parseFloat(t.amount || 0),
        paymentMethod: t.payment_method || 'UPI / Razorpay',
        status: t.status || 'captured',
        invoiceNumber: t.invoice_number || defaultInv,
        timestamp: formatIstTimestamp(t.created_at)
      };
    });

    return NextResponse.json({
      success: true,
      total,
      page,
      totalPages,
      transactions
    });
  } catch (err: any) {
    console.error("GET /api/super-admin/transactions error:", err);
    return NextResponse.json({ success: false, error: err.message, transactions: [] }, { status: 500 });
  }
}
