import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

/**
 * GET /api/pricing — public, no authentication required
 * POST /api/pricing — super-admin only
 */

export async function GET() {
  try {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings')
        .eq('id', 'pricing_config')
        .single();

      if (!error && data?.settings) {
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

    return NextResponse.json({ success: true, message: 'Platform pricing updated live!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
