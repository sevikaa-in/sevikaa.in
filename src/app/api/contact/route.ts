import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { queryDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;
    const cleanSubject = subject || 'General Enquiry';
    const cleanMessage = message.trim();
    const createdAt = new Date().toISOString();

    const payload = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      status: 'pending',
      created_at: createdAt,
    };

    let insertedData: any = null;

    // 1. Try storing in Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('contact_enquiries')
        .insert([payload])
        .select()
        .maybeSingle();

      if (!error && data) {
        insertedData = data;
      }
    } catch (sbErr) {
      console.warn("[contact/route] Supabase insert warning:", sbErr);
    }

    // 2. PostgreSQL Direct Storage & Persistent DB Fallback
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
        INSERT INTO public.contact_enquiries (name, email, phone, subject, message, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage, 'pending', createdAt]);

      if (pgRes?.rows?.[0]) {
        insertedData = insertedData || pgRes.rows[0];
      }
    } catch (pgErr) {
      console.warn("[contact/route] Postgres insert warning:", pgErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your enquiry has been received. Our support team will get back to you shortly.',
      enquiry: insertedData || payload,
    });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
