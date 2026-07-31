import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, targetRole } = body;

    if (!userId || !targetRole) {
      return NextResponse.json({ error: 'userId and targetRole (worker | employer) are required' }, { status: 400 });
    }

    if (targetRole !== 'worker' && targetRole !== 'employer') {
      return NextResponse.json({ error: 'Target role must be worker or employer' }, { status: 400 });
    }

    // 1. Fetch current profile
    const pRes = await queryDb(`SELECT id, phone, email, full_name, role FROM public.profiles WHERE id = $1 LIMIT 1`, [userId]);
    if (!pRes || pRes.rows.length === 0) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const user = pRes.rows[0];
    if (user.role === targetRole) {
      return NextResponse.json({ success: true, message: `User is already a ${targetRole}` });
    }

    // 2. Update role in public.profiles
    await queryDb(`UPDATE public.profiles SET role = $1 WHERE id = $2`, [targetRole, userId]);

    // 3. Handle profile table sync
    if (targetRole === 'employer') {
      // Create employer_profiles record if missing
      await queryDb(
        `INSERT INTO public.employer_profiles (id, user_id, company_name, created_at, updated_at) 
         VALUES ($1, $1, $2, NOW(), NOW()) 
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
        [userId, user.full_name || 'Household Owner']
      );
      // Clean up stub from worker_profiles if present
      await queryDb(`DELETE FROM public.worker_profiles WHERE user_id = $1 OR id = $1`, [userId]);
    } else {
      // Create worker_profiles record if missing
      await queryDb(
        `INSERT INTO public.worker_profiles (id, user_id, full_name, created_at) 
         VALUES ($1, $1, $2, NOW()) 
         ON CONFLICT (id) DO NOTHING`,
        [userId, user.full_name || 'Registered Candidate']
      );
      // Clean up stub from employer_profiles if present
      await queryDb(`DELETE FROM public.employer_profiles WHERE user_id = $1 OR id = $1`, [userId]);
    }

    return NextResponse.json({
      success: true,
      message: `User role successfully switched from ${user.role} to ${targetRole}!`,
      newRole: targetRole
    });
  } catch (err: any) {
    console.error("Switch user role error:", err);
    return NextResponse.json({ error: err.message || 'Server error switching role' }, { status: 500 });
  }
}
