import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/paymentService';
import { getServerEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    const razorpaySecret = env.RAZORPAY_KEY_SECRET;
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // 1. Verify Webhook Signature via PaymentService
    const isValid = PaymentService.verifyRazorpaySignature(rawBody, signature, razorpaySecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or missing webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log(`[Razorpay Webhook] Received Event: ${payload.event}`);

    // 2. Process Event via PaymentService
    const result = await PaymentService.processRazorpayEvent(payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 400 });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Processing failed:", err);
    return NextResponse.json({ error: err.message || 'Webhook internal failure' }, { status: 500 });
  }
}

