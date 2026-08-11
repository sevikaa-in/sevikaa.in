import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

// Item 30: tele_call_notes table created in migration 20260810000004 — no runtime DDL

// GET: Fetch notes for a lead
export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get('lead_id');

    if (!lead_id) {
      return NextResponse.json({ success: false, error: "lead_id is required" }, { status: 400 });
    }

    const res = await queryDb(
      `SELECT * FROM public.tele_call_notes WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [lead_id]
    );

    return NextResponse.json({
      success: true,
      notes: res?.rows || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add new call note for a lead
export async function POST(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'admin' });
  if (errorResponse) return errorResponse;
  // Item 30: tele_call_notes managed by migration — no runtime DDL
  try {
    const body = await req.json();
    const { lead_id, admin_name, note_text, call_outcome, callback_at } = body;

    if (!lead_id || !note_text?.trim()) {
      return NextResponse.json({ success: false, error: "lead_id and note_text are required" }, { status: 400 });
    }

    const nameToUse = admin_name || "Admin";
    const outcomeToUse = call_outcome || "connected";

    const res = await queryDb(
      `INSERT INTO public.tele_call_notes (lead_id, admin_name, note_text, call_outcome, callback_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [lead_id, nameToUse, note_text.trim(), outcomeToUse, callback_at || null]
    );

    // last_called_by/last_called_at columns added in migration — no runtime DDL
    try {
      await queryDb(
        `UPDATE public.profiles SET last_called_by = $1, last_called_at = NOW() WHERE id::text = $2 OR phone = $2`,
        [nameToUse, lead_id]
      );
    } catch (profileErr) {
      console.warn("Could not update last_called_by on profiles:", profileErr);
    }

    return NextResponse.json({
      success: true,
      note: res?.rows?.[0]
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
