import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    let userId: string | null = null;
    if (token && token.length > 20) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    const { searchParams } = new URL(request.url);
    const reqUserId = searchParams.get('userId') || userId;

    let sql = `
      SELECT 
        id, 
        order_id, 
        user_id, 
        employer_name, 
        employer_email, 
        employer_phone, 
        plan_name, 
        amount, 
        payment_method, 
        status, 
        created_at 
      FROM public.transactions
    `;

    const params: any[] = [];
    if (reqUserId) {
      params.push(reqUserId);
      sql += ` WHERE user_id::text = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await queryDb(sql, params).catch(() => ({ rows: [] }));

    return NextResponse.json({
      success: true,
      invoices: result?.rows || [],
      count: result?.rows?.length || 0
    });
  } catch (err: any) {
    console.error("Employer invoices API error:", err);
    return NextResponse.json({ error: err.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}
