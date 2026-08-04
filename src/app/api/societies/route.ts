import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function GET() {
  try {
    let societies: any[] = [];

    // 1. Direct DB Query on public.societies with pure SQL count of registered employer households
    try {
      await queryDb(`
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS society_name text;
        ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS total_flats integer;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS society_name text;

        UPDATE public.employer_profiles ep
        SET society_name = s.name
        FROM public.jobs j
        JOIN public.societies s ON s.id::text = j.society_id::text OR j.society_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', j.society_name, '%')
        WHERE (ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text)
          AND (ep.society_name IS NULL OR TRIM(ep.society_name) = '');

        UPDATE public.profiles p
        SET society_name = s.name
        FROM public.jobs j
        JOIN public.societies s ON s.id::text = j.society_id::text OR j.society_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', j.society_name, '%')
        WHERE p.id::text = j.employer_id::text
          AND (p.society_name IS NULL OR TRIM(p.society_name) = '');
      `).catch(() => {});

      let dbRes = await queryDb(`
        SELECT s.*,
               COALESCE((
                 SELECT COUNT(*) 
                 FROM public.jobs j 
                 LEFT JOIN public.employer_profiles ep ON ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text
                 LEFT JOIN public.profiles p ON p.id::text = j.employer_id::text
                 WHERE (j.status IS NULL OR j.status NOT IN ('closed', 'fulfilled', 'cancelled')) 
                   AND (
                     j.society_id::text = s.id::text 
                     OR (j.society_name IS NOT NULL AND TRIM(j.society_name) <> '' AND (j.society_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', j.society_name, '%')))
                     OR (ep.society_name IS NOT NULL AND TRIM(ep.society_name) <> '' AND (ep.society_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', ep.society_name, '%')))
                     OR (p.society_name IS NOT NULL AND TRIM(p.society_name) <> '' AND (p.society_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', p.society_name, '%')))
                   )
               ), 0) AS active_jobs_count,
               COALESCE((
                 SELECT COUNT(DISTINCT uid) FROM (
                   SELECT ep.user_id::text AS uid, ep.society_name AS soc_name FROM public.employer_profiles ep WHERE ep.user_id IS NOT NULL AND ep.society_name IS NOT NULL
                   UNION ALL
                   SELECT p.id::text AS uid, p.society_name AS soc_name FROM public.profiles p WHERE (p.role = 'employer' OR p.role = 'user') AND p.id IS NOT NULL AND p.society_name IS NOT NULL
                   UNION ALL
                   SELECT j.employer_id::text AS uid, COALESCE(j.society_name, ep.society_name) AS soc_name FROM public.jobs j LEFT JOIN public.employer_profiles ep ON ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text WHERE j.employer_id IS NOT NULL
                 ) emp_union
                 WHERE emp_union.soc_name IS NOT NULL AND TRIM(emp_union.soc_name) <> ''
                   AND (emp_union.soc_name ILIKE CONCAT('%', s.name, '%') OR s.name ILIKE CONCAT('%', emp_union.soc_name, '%'))
               ), 0) AS employers_count
        FROM public.societies s
        ORDER BY s.name ASC
      `);

      if (!dbRes || !dbRes.rows || dbRes.rows.length === 0) {
        // Auto-seed base societies in PostgreSQL table if empty
        await queryDb(`
          INSERT INTO public.societies (name, city, latitude, longitude)
          VALUES 
            ('Prestige Shantiniketan', 'Bengaluru', 12.9900, 77.7280),
            ('DLF Westend Heights', 'Bengaluru', 12.8720, 77.6105),
            ('Prestige Song of the South', 'Bengaluru', 12.8680, 77.6120),
            ('SNN Raj Serenity', 'Bengaluru', 12.8650, 77.6150),
            ('Brigade Gateway', 'Bengaluru', 13.0120, 77.5550),
            ('Adarsh Palm Retreat', 'Bengaluru', 12.9250, 77.6850),
            ('Sobha Royal Pavilion', 'Bengaluru', 12.9050, 77.6950),
            ('Purva Westend', 'Bengaluru', 12.8850, 77.6450)
          ON CONFLICT DO NOTHING;
        `).catch(() => {});

        dbRes = await queryDb(`
          SELECT s.*,
                 COALESCE((SELECT COUNT(*) FROM public.jobs j WHERE (j.society_id = s.id OR j.description ILIKE CONCAT('%', s.name, '%') OR j.society_name ILIKE CONCAT('%', s.name, '%')) AND j.status IN ('pending', 'approved', 'active')), 0) AS active_jobs_count,
                 COALESCE((SELECT COUNT(DISTINCT ep.user_id) FROM public.employer_profiles ep WHERE (ep.society_name ILIKE CONCAT('%', s.name, '%') OR ep.billing_address ILIKE CONCAT('%', s.name, '%'))), 0) AS employers_count
          FROM public.societies s
          ORDER BY s.name ASC
        `);
      }

      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        societies = dbRes.rows;
      }
    } catch (dbErr) {
      console.warn("Direct DB societies query notice:", dbErr);
    }

    // 2. Supabase Admin Fallback on public.societies
    if (societies.length === 0 && supabaseAdmin) {
      try {
        const { data: sbData } = await supabaseAdmin
          .from('societies')
          .select('*')
          .order('name', { ascending: true });
        if (sbData && sbData.length > 0) {
          societies = sbData;
        }
      } catch (sErr) {
        console.warn("Supabase societies query notice:", sErr);
      }
    }

    return NextResponse.json(
      { success: true, societies },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error("Societies API error:", err);
    return NextResponse.json({ error: err.message || 'Error fetching societies' }, { status: 500 });
  }
}
