import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';
import { getCached, setCached, invalidateCache } from '@/lib/ttlCache';

/**
 * GET /api/pricing — public, no authentication required (5-min TTL cached)
 * POST /api/pricing — super-admin only (invalidates cache on update)
 */

const PRICING_CACHE_KEY = 'platform:pricing_config';
let lastKnownGoodPricing: any = null;

export async function GET() {
  try {
    // 1. Check TTL cache
    const cachedPricing = getCached(PRICING_CACHE_KEY);
    if (cachedPricing) {
      return NextResponse.json({ success: true, pricing: cachedPricing, cached: true });
    }

    // 2. Fetch from Database
    const { data, error } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('id', 'pricing_config')
      .single();

    if (!error && data?.settings) {
      setCached(PRICING_CACHE_KEY, data.settings, 300); // 5 min TTL
      lastKnownGoodPricing = data.settings;
      return NextResponse.json({ success: true, pricing: data.settings });
    }

    // 3. Fallback: If DB query fails but we have stale last-known-good pricing
    if (lastKnownGoodPricing) {
      return NextResponse.json({ success: true, pricing: lastKnownGoodPricing, cached: true, stale: true });
    }

    // 4. Fail Closed: No valid DB data & no cache -> HTTP 503
    return NextResponse.json(
      { success: false, error: 'Pricing service temporarily unavailable.' },
      { status: 503 }
    );
  } catch (err: any) {
    if (lastKnownGoodPricing) {
      return NextResponse.json({ success: true, pricing: lastKnownGoodPricing, cached: true, stale: true });
    }
    return NextResponse.json(
      { success: false, error: 'Pricing service temporarily unavailable.' },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require super-admin — pricing config controls live subscription pricing
    const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'super-admin' });
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid settings payload' }, { status: 400 });
    }

    const { error } = await supabase
      .from('platform_settings')
      .upsert({ id: 'pricing_config', settings });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Invalidate TTL cache on update
    invalidateCache(PRICING_CACHE_KEY);
    lastKnownGoodPricing = settings;

    return NextResponse.json({ success: true, message: 'Platform pricing updated live!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
