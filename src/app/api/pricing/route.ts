import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';
import { getCached, setCached, invalidateCache } from '@/lib/ttlCache';

/**
 * GET /api/pricing — public, no authentication required (5-min TTL cached)
 * POST /api/pricing — super-admin only (invalidates cache on update)
 */

const PRICING_CACHE_KEY = 'platform:pricing_config';

export async function GET() {
  try {
    // 1. Check TTL cache to save database query egress
    const cachedPricing = getCached(PRICING_CACHE_KEY);
    if (cachedPricing) {
      return NextResponse.json({ success: true, pricing: cachedPricing, cached: true });
    }

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings')
        .eq('id', 'pricing_config')
        .single();

      if (!error && data?.settings) {
        setCached(PRICING_CACHE_KEY, data.settings, 300); // 5 min TTL
        return NextResponse.json({ success: true, pricing: data.settings });
      }
    }

    // Default Fallback Pricing Config
    const defaultPricing = {
      workerRegistration: '0',
      freePlan: { price: '0', validityDays: '7 Days', jobPostsLimit: '1', contactUnlocksLimit: '0', name: 'Free Trial Pass' },
      basicPlan: { price: '299', validityDays: '30 Days', jobPostsLimit: '3', contactUnlocksLimit: '10', name: 'Basic Household Pass' },
      premiumPlan: { price: '699', validityDays: '60 Days', jobPostsLimit: '10', contactUnlocksLimit: '50', name: 'Standard Family Plan' },
      proPlan: { price: '1499', validityDays: '90 Days', jobPostsLimit: 'Unlimited', contactUnlocksLimit: 'Unlimited', name: 'Pro Unlimited Household Pass' }
    };

    setCached(PRICING_CACHE_KEY, defaultPricing, 300);
    return NextResponse.json({ success: true, pricing: defaultPricing });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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

    return NextResponse.json({ success: true, message: 'Platform pricing updated live!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
