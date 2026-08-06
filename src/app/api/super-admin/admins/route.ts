import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET() {
  try {
    const res = await queryDb(
      `SELECT id, email, COALESCE(full_name, '') AS full_name, role, status, COALESCE(created_at, NOW()) AS created_at 
       FROM public.profiles 
       WHERE LOWER(role) IN ('admin', 'super-admin', 'super_admin', 'moderator') 
       ORDER BY created_at DESC`
    );

    const admins = (res?.rows || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.full_name || row.email.split('@')[0],
      full_name: row.full_name || '',
      role: row.role || 'admin',
      status: row.status || 'active',
      created: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : 'Active'
    }));

    return NextResponse.json({ success: true, admins });
  } catch (error: any) {
    console.error("GET /api/super-admin/admins error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, full_name, role = 'admin' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (full_name || '').trim();

    const insertRes = await queryDb(
      `INSERT INTO public.profiles (id, email, full_name, role, status, created_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'active', NOW())
       ON CONFLICT (email) 
       DO UPDATE SET 
         full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
         role = EXCLUDED.role, 
         status = 'active'
       RETURNING id, email, full_name, role, status, created_at`,
      [cleanEmail, cleanName, role]
    );

    const newAdmin = insertRes?.rows?.[0] || {
      id: `admin_${Date.now()}`,
      email: cleanEmail,
      full_name: cleanName,
      role,
      status: 'active',
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.full_name || cleanEmail.split('@')[0],
        full_name: newAdmin.full_name || '',
        role: newAdmin.role,
        status: newAdmin.status,
        created: new Date(newAdmin.created_at).toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    console.error("POST /api/super-admin/admins error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
