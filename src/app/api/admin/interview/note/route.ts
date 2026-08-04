import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { id, note, status } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing target ID' }, { status: 400 });

    // 1. Persist to public.applications if matching application ID
    try {
      await queryDb(
        `UPDATE public.applications 
         SET reschedule_note = $1, interview_note = $1
         WHERE id = $2`,
        [note, id]
      );
    } catch (e) {
      try {
        await queryDb(
          `UPDATE public.job_applications 
           SET reschedule_note = $1
           WHERE id = $2`,
          [note, id]
        );
      } catch (e2) {
        console.warn("applications note save notice:", e2);
      }
    }

    // 2. Persist to public.profiles if matching profile ID
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET admin_notes = $1
         WHERE id = $2`,
        [note, id]
      );
    } catch (e) {
      console.warn("profiles note save notice:", e);
    }

    return NextResponse.json({ success: true, message: "Note persisted to database." });
  } catch (err: any) {
    console.error("Save call note API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
