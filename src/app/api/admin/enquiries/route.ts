import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Supabase fetch contact_enquiries error:", error.message);
      // Return empty array if table isn't initialized
      return NextResponse.json({ enquiries: [] });
    }

    return NextResponse.json({ enquiries: data || [] });
  } catch (err: any) {
    console.error("Fetch enquiries API error:", err);
    return NextResponse.json({ enquiries: [] });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status, admin_notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('contact_enquiries')
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, enquiry: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
