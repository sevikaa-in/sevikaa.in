import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

/**
 * Server-side Razorpay order creation
 * Replaces client-controlled amount/plan selection.
 * Architecture:
 *   Employer → POST /api/payments/create-order { planId }
 *           → Server validates planId & price from DB
 *           → Server calls Razorpay Orders API
 *           → Stores checkout_sessions mapping with expires_at (NOW() + 30 min)
 *           → Returns { orderId, amount, currency, keyId }
 *           → Webhook activates subscription exclusively
 */

const PLAN_PRICES: Record<string, { price: number; name: string; validity: string }> = {
  free:     { price: 0,    name: 'Free Trial Pass',              validity: '7 Days' },
  basic:    { price: 299,  name: 'Basic Household Pass',         validity: '30 Days' },
  standard: { price: 699,  name: 'Standard Family Plan',         validity: '60 Days' },
  premium:  { price: 699,  name: 'Standard Family Plan',         validity: '60 Days' },
  pro:      { price: 1499, name: 'Pro Unlimited Household Pass', validity: '90 Days' },
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — identity strictly from verified bearer token
    const authHeader = req.headers.get('authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;
    if (!token) {
      const sbCookie = Array.from(req.cookies.getAll()).find(c =>
        c.name.includes('auth-token') || c.name.includes('access-token') || c.name.endsWith('-auth-token')
      );
      if (sbCookie?.value) {
        try { const p = JSON.parse(sbCookie.value); token = p.access_token || sbCookie.value; }
        catch { token = sbCookie.value; }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to create a payment order.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session.' }, { status: 401 });
    }
    const userId = user.id;

    // 2. Validate planId from DB pricing (server controls price)
    const body = await req.json().catch(() => ({}));
    const rawPlanId = (body.planId || body.plan_id || 'standard').toString().toLowerCase();

    if (!PLAN_PRICES[rawPlanId]) {
      return NextResponse.json({ error: 'Invalid plan. Valid plans: free, basic, standard, premium, pro' }, { status: 400 });
    }

    const canonicalPlanId = rawPlanId === 'premium' ? 'standard' : rawPlanId;
    let planPrice = PLAN_PRICES[rawPlanId].price;
    let planName = PLAN_PRICES[rawPlanId].name;

    // Fetch live pricing from DB (overrides hardcoded if exists)
    try {
      const pricingRes = await queryDb(
        `SELECT settings FROM public.platform_settings WHERE id = 'pricing_config' LIMIT 1`
      );
      if (pricingRes?.rows?.[0]?.settings) {
        const settings = pricingRes.rows[0].settings;
        const planKey = `${canonicalPlanId}Plan`;
        if (settings[planKey]?.price !== undefined) {
          planPrice = parseInt(settings[planKey].price, 10);
          planName = settings[planKey].name || planName;
        }
      }
    } catch { /* use default fallback prices */ }

    // Free plan — no Razorpay order needed
    if (planPrice === 0) {
      return NextResponse.json({
        success: true,
        orderId: null,
        amount: 0,
        currency: 'INR',
        planId: canonicalPlanId,
        planName,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        isFree: true,
      });
    }

    // 3. Verify Razorpay credentials
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeyId || !razorpaySecret) {
      console.error('[create-order] Razorpay credentials missing');
      return NextResponse.json({ error: 'Payment service configuration error.' }, { status: 503 });
    }

    // 4. Create Razorpay order server-side
    const razorpayAuth = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
    const internalOrderRef = `sev_${userId.slice(0, 8)}_${canonicalPlanId}_${Date.now()}`;

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${razorpayAuth}`,
      },
      body: JSON.stringify({
        amount: planPrice * 100, // paise
        currency: 'INR',
        receipt: internalOrderRef,
        notes: {
          internal_ref: internalOrderRef,
          plan_id: canonicalPlanId,
          user_id: userId,
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errBody = await rzpResponse.text();
      console.error('[create-order] Razorpay API error:', errBody);
      return NextResponse.json({ error: 'Failed to create payment order with gateway. Please try again.' }, { status: 502 });
    }

    const rzpOrder = await rzpResponse.json();
    const razorpayOrderId = rzpOrder.id;

    // 5. Store checkout session — MUST include expires_at and FAIL on DB error (Audit 6 Fix #3)
    const sessionTokenRaw = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(sessionTokenRaw).digest('hex');

    try {
      await queryDb(
        `INSERT INTO public.checkout_sessions
           (token_hash, user_id, plan_id, expected_amount, razorpay_order_id, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 minutes', NOW())
         ON CONFLICT (razorpay_order_id) DO UPDATE
           SET user_id = EXCLUDED.user_id,
               plan_id = EXCLUDED.plan_id,
               expected_amount = EXCLUDED.expected_amount,
               expires_at = NOW() + INTERVAL '30 minutes',
               created_at = NOW()`,
        [sessionTokenHash, userId, canonicalPlanId, planPrice, razorpayOrderId]
      );
    } catch (dbErr: any) {
      console.error('[create-order] CRITICAL: checkout_sessions insertion failed:', dbErr);
      return NextResponse.json({ error: 'Failed to record checkout session. Payment initialized safely.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount: planPrice * 100, // paise for Razorpay SDK
      currency: 'INR',
      planId: canonicalPlanId,
      planName,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayKeyId,
    });
  } catch (err: any) {
    console.error('[create-order] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
