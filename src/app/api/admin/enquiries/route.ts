import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';
import { queryDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    let enquiriesList: any[] = [];

    // 1. Try Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('contact_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        enquiriesList = data;
      }
    } catch (sbErr) {
      console.warn("[admin/enquiries] Supabase fetch notice:", sbErr);
    }

    // 2. Try Postgres DB if Supabase returned no rows or errored
    if (enquiriesList.length === 0) {
      try {
        await queryDb(`
          CREATE TABLE IF NOT EXISTS public.contact_enquiries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `, []);

        const pgRes = await queryDb(`
          SELECT * FROM public.contact_enquiries 
          ORDER BY created_at DESC
        `, []);
        if (pgRes?.rows && Array.isArray(pgRes.rows)) {
          enquiriesList = pgRes.rows;
        }
      } catch (pgErr) {
        console.warn("[admin/enquiries] Postgres fetch notice:", pgErr);
      }
    }

    return NextResponse.json({ enquiries: enquiriesList });
  } catch (err: any) {
    console.error("Fetch enquiries API error:", err);
    return NextResponse.json({ enquiries: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    const { id, status, admin_notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();

    // 1. Update Supabase
    try {
      await supabaseAdmin
        .from('contact_enquiries')
        .update({
          status,
          admin_notes: admin_notes || null,
          updated_at: updatedAt,
        })
        .eq('id', id);
    } catch (sbErr) {}

    // 2. Update Postgres DB
    try {
      await queryDb(`
        UPDATE public.contact_enquiries
        SET status = $1, admin_notes = $2, updated_at = $3
        WHERE id = $4
      `, [status, admin_notes || null, updatedAt, id]);
    } catch (pgErr) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

