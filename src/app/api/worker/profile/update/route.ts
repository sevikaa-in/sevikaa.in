import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, name, full_name, phone, email, gender, age, 
      expectedSalary, experience, skills, languages, bio, 
      emergencyContact, preferredShift, profile_picture_url, status 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const displayName = full_name || name || 'Worker';
    const expYears = parseInt(experience) || 0;
    const salary = parseInt(expectedSalary) || 15000;
    const numAge = parseInt(age) || 28;

    // 1. Update public.profiles
    try {
      await queryDb(
        `UPDATE public.profiles 
         SET phone = COALESCE($1, phone),
             email = COALESCE($2, email)
         WHERE id = $3`,
        [phone || null, email || null, userId]
      );
    } catch (pErr) {
      console.warn("Profiles update notice:", pErr);
    }

    // 2. Direct PostgreSQL update with queryDb (updates both full_name & name)
    try {
      const checkRes = await queryDb(
        `SELECT id FROM public.worker_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`, 
        [userId]
      );

      if (checkRes && checkRes.rows.length > 0) {
        await queryDb(
          `UPDATE public.worker_profiles 
           SET full_name = $1, 
               gender = COALESCE($2, gender), 
               age = COALESCE($3, age), 
               expected_salary = COALESCE($4, expected_salary), 
               experience_years = COALESCE($5, experience_years)
           WHERE user_id = $6 OR id = $6`,
          [displayName, gender || 'female', numAge, salary, expYears, userId]
        );
      } else {
        await queryDb(
          `INSERT INTO public.worker_profiles 
             (id, user_id, full_name, phone, email, gender, age, expected_salary, experience_years, status)
           VALUES 
             ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userId, displayName, phone || null, email || null, gender || 'female', numAge, salary, expYears, status || 'pending_verification']
        );
      }
    } catch (dbErr) {
      console.warn("Direct DB worker_profiles update warning:", dbErr);
    }

    // 3. Supabase Admin Client sync
    if (supabaseAdmin) {
      try {
        const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);

        const payload: any = {
          user_id: userId,
          full_name: displayName,
          phone: phone || undefined,
          email: email || undefined,
          gender: gender || 'female',
          age: numAge,
          expected_salary: salary,
          experience_years: expYears,
          skills: skillsArr,
          bio: bio || undefined,
          emergency_contact: emergencyContact || undefined,
          preferred_shift: preferredShift || undefined,
          profile_picture_url: profile_picture_url || undefined
        };

        if (status) payload.status = status;

        const { data: existingWp } = await supabaseAdmin
          .from('worker_profiles')
          .select('id')
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle();

        if (existingWp) {
          await supabaseAdmin
            .from('worker_profiles')
            .update(payload)
            .eq('id', existingWp.id);
        } else {
          await supabaseAdmin
            .from('worker_profiles')
            .insert([{ ...payload, id: userId }]);
        }
      } catch (adminErr) {
        console.warn("Supabase admin worker update warning:", adminErr);
      }
    }

    // 4. Multi-Admin Parallel Capacity Queueing Algorithm (15-minute intervals scaled by admin team size)
    if (phone) {
      try {
        const { sendSMS } = require('@/lib/notifications');

        // Dynamically query active admin count (e.g. 3 admins = 3 parallel calls per 15-min slot)
        let adminCount = 1;
        let pendingCount = 0;
        try {
          const adminRes = await queryDb(`SELECT COUNT(*) FROM public.profiles WHERE role = 'admin' OR role = 'super-admin'`);
          adminCount = Math.max(1, parseInt(adminRes?.rows?.[0]?.count || '1', 10));

          const countRes = await queryDb(
            `SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND (status = 'pending_verification' OR status = 'pending_review' OR status = 'admin_interview')`
          );
          pendingCount = parseInt(countRes?.rows?.[0]?.count || '0', 10);
        } catch (e) {}

        // Scale slot index by admin capacity (e.g., 3 admins = 3 workers per 15-min slot)
        const slotIndex = Math.floor(pendingCount / adminCount);
        const offsetMinutes = (slotIndex % 32) * 15; // Spreads across 32 daytime slots (8 hours x 4 slots/hr)

        const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        
        let slotDate = new Date(nowIST);
        if (nowIST.getHours() >= 17 || nowIST.getHours() < 8) {
          slotDate.setDate(slotDate.getDate() + (nowIST.getHours() >= 17 ? 1 : 0));
          slotDate.setHours(9, 0, 0, 0);
        } else {
          slotDate.setHours(slotDate.getHours() + 1, 0, 0, 0);
        }

        // Apply staggered offset
        slotDate.setMinutes(slotDate.getMinutes() + offsetMinutes);

        const isTomorrow = slotDate.getDate() !== nowIST.getDate();
        const dateStr = isTomorrow ? 'Tomorrow' : 'Today';
        const hours = slotDate.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = (hours % 12) || 12;
        const minutesStr = slotDate.getMinutes().toString().padStart(2, '0');
        const timeStr = `${displayHour.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;

        await sendSMS(phone, 'INTERVIEW_SCHEDULED', {
          name: displayName,
          date: dateStr,
          time: timeStr
        });
      } catch (smsErr) {
        console.warn("Automated DLT SMS dispatch notice:", smsErr);
      }
    }

    return NextResponse.json({ success: true, name: displayName });
  } catch (err: any) {
    console.error("Worker profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
