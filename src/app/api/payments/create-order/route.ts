import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { getCached, setCached } from '@/lib/ttlCache';
import { getServerEnv } from '@/lib/env';
import crypto from 'crypto';

/**
 * Server-side Razorpay order creation
 * Replaces client-controlled amount/plan selection.
 * Architecture:
 *   Employer → POST /api/payments/create-order { planId }
 *           → Server validates planId & price from DB or cache (Fail Closed 503)
 *           → Server calls Razorpay Orders API
 *           → Stores checkout_sessions mapping with expires_at (NOW() + 30 min)
 *           → Returns { orderId, amount, currency, keyId }
 *           → Webhook activates subscription exclusively
 */

const PRICING_CACHE_KEY = 'platform:pricing_config';

export async function POST(req: NextRequest) {
  const env = getServerEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const supabase = createClient(supabaseUrl || 'https://unconfigured.local', supabaseAnonKey || 'unconfigured', {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session.' }, { status: 401 });
    }
    const userId = user.id;

    // 2. Validate planId from DB pricing or cache (Fail Closed if pricing unavailable)
    const body = await req.json().catch(() => ({}));
    const rawPlanId = (body.planId || body.plan_id || 'standard').toString().toLowerCase();
    const VALID_PLANS = new Set(['free', 'basic', 'standard', 'premium', 'pro']);

    if (!VALID_PLANS.has(rawPlanId)) {
      return NextResponse.json({ error: 'Invalid plan. Valid plans: free, basic, standard, premium, pro' }, { status: 400 });
    }

    const canonicalPlanId = rawPlanId === 'premium' ? 'standard' : rawPlanId;
    const planKey = `${canonicalPlanId}Plan`;

    let activeSettings: any = null;

    // A. Attempt DB query for pricing
    try {
      const pricingRes = await queryDb(
        `SELECT settings FROM public.platform_settings WHERE id = 'pricing_config' LIMIT 1`
      );
      if (pricingRes?.rows?.[0]?.settings) {
        activeSettings = pricingRes.rows[0].settings;
        setCached(PRICING_CACHE_KEY, activeSettings, 300); // Update 5-min TTL cache
      }
    } catch (dbErr) {
      console.warn('[create-order] Pricing DB query unavailable, checking cache:', dbErr);
    }

    // B. Attempt Cache lookup if DB query returned nothing
    if (!activeSettings) {
      activeSettings = getCached(PRICING_CACHE_KEY);
    }

    // C. Fail Closed: If neither DB nor cache provides pricing, return HTTP 503
    if (!activeSettings) {
      return NextResponse.json(
        { error: 'Service Unavailable', message: 'Pricing database unavailable and no valid cached pricing exists.' },
        { status: 503 }
      );
    }

    let planPrice: number | null = null;
    let planName = `${canonicalPlanId.toUpperCase()} Plan`;

    if (canonicalPlanId === 'free' && (activeSettings.freePlan?.price !== undefined || activeSettings.workerRegistration !== undefined)) {
      planPrice = 0;
      planName = activeSettings.freePlan?.name || 'Free Trial Pass';
    } else if (activeSettings[planKey]?.price !== undefined) {
      planPrice = parseInt(activeSettings[planKey].price, 10);
      planName = activeSettings[planKey].name || planName;
    }

    if (planPrice === null || isNaN(planPrice)) {
      return NextResponse.json(
        { error: 'Service Unavailable', message: 'Requested plan pricing not configured on server.' },
        { status: 503 }
      );
    }

    // Free plan — no Razorpay order needed
    if (planPrice === 0) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabaseAdminClient');
        const { error: freeSubErr } = await supabaseAdmin
          .from('employer_profiles')
          .update({ subscription_status: 'free' })
          .eq('user_id', userId);

        if (freeSubErr) {
          console.error('[create-order] CRITICAL: Free plan activation DB update failed:', freeSubErr);
          return NextResponse.json(
            { error: 'Failed to activate free plan in database.', message: freeSubErr.message },
            { status: 500 }
          );
        }
      } catch (freeErr: any) {
        console.error('[create-order] CRITICAL: Free plan activation exception:', freeErr);
        return NextResponse.json(
          { error: 'Failed to activate free plan in database.', message: freeErr?.message || 'Database error' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: null,
        amount: 0,
        currency: 'INR',
        planId: canonicalPlanId,
        planName,
        keyId: env.RAZORPAY_KEY_ID,
        isFree: true,
      });
    }

    // 3. Verify Razorpay credentials
    const razorpayKeyId = env.RAZORPAY_KEY_ID;
    const razorpaySecret = env.RAZORPAY_KEY_SECRET;
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

    // 5. Store checkout session
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
      keyId: razorpayKeyId,
    });
  } catch (err: any) {
    console.error('[create-order] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
