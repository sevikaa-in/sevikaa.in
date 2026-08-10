import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

async function ensureAdminSettingsTable() {
  try {
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.admin_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.warn("Notice ensuring admin_settings table:", err);
  }
}

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'super-admin' });
  if (errorResponse) return errorResponse;

  try {
    await ensureAdminSettingsTable();
    const res = await queryDb(`SELECT key, value FROM public.admin_settings`);
    const settings: Record<string, string> = {
      helpline_phone: process.env.NEXT_PUBLIC_ADMIN_HELPLINE_PHONE || '+91 7096093039',
      whatsapp_number: '+91 7096093039',
      support_email: 'support@sevikaa.in'
    };

    if (res && res.rows) {
      res.rows.forEach((row: any) => {
        if (row.key && row.value) {
          settings[row.key] = row.value;
        }
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'super-admin' });
  if (errorResponse) return errorResponse;

  try {
    await ensureAdminSettingsTable();
    const body = await req.json();
    const { helpline_phone, whatsapp_number, support_email } = body;

    const updates = [
      { key: 'helpline_phone', value: helpline_phone },
      { key: 'whatsapp_number', value: whatsapp_number },
      { key: 'support_email', value: support_email }
    ];

    for (const item of updates) {
      if (item.value) {
        await queryDb(
          `INSERT INTO public.admin_settings (key, value, updated_at) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (key) 
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [item.key, item.value]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Official communication numbers & support details updated successfully!'
    });
  } catch (err: any) {
    console.error("Super Admin settings API error:", err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
