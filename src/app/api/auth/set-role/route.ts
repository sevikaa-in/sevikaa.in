import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (role !== 'worker' && role !== 'employer') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    // 1. Update public.profiles role
    await queryDb(`UPDATE public.profiles SET role = $1 WHERE id = $2`, [role, userId]);

    // 2. Initialize sub-profile stub if not exists
    if (role === 'employer') {
      const epCheck = await queryDb(`SELECT id FROM public.employer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [userId]);
      if (!epCheck || epCheck.rows.length === 0) {
        try {
          await queryDb(
            `INSERT INTO public.employer_profiles (id, user_id, company_name, status) VALUES ($1, $1, $2, 'active')`,
            [userId, 'Employer']
          );
        } catch (epErr) {
          console.warn("Employer profile stub insert notice:", epErr);
        }
      }
    } else {
      const wpCheck = await queryDb(`SELECT id FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, [userId]);
      if (!wpCheck || wpCheck.rows.length === 0) {
        try {
          await queryDb(
            `INSERT INTO public.worker_profiles (id, user_id, full_name, status) VALUES ($1, $1, $2, 'pending_verification')`,
            [userId, 'Worker']
          );
        } catch (wpErr) {
          console.warn("Worker profile stub insert notice:", wpErr);
        }
      }
    }

    return NextResponse.json({ success: true, role });
  } catch (err: any) {
    console.error("Set role API error:", err);
    return NextResponse.json({ error: err.message || 'Server error setting role' }, { status: 500 });
  }
}
