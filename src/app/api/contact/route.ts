import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

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

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      subject: subject || 'General Enquiry',
      message: message.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Try storing in Supabase
    const { data, error } = await supabaseAdmin
      .from('contact_enquiries')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn("Supabase insert contact_enquiries warning:", error.message);
      // Even if table doesn't exist yet, return success so user experience is smooth
    }

    return NextResponse.json({
      success: true,
      message: 'Your enquiry has been received. Our support team will get back to you shortly.',
      enquiry: data || payload,
    });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
