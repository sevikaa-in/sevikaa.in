import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { memoryCache } from '@/lib/memoryCache';

export async function GET() {
  try {
    const cacheKey = 'societies_all_list_v2';
    const cachedSocieties = memoryCache.get<any[]>(cacheKey);
    if (cachedSocieties && Array.isArray(cachedSocieties) && cachedSocieties.length > 0) {
      return NextResponse.json(
        { success: true, societies: cachedSocieties },
        { headers: { 'X-Cache': 'HIT-MEMORY', 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
      );
    }

    let societies: any[] = [];

    // 1. Direct DB Query on public.societies
    try {
      const dbRes = await queryDb(
        `SELECT * FROM public.societies ORDER BY name ASC`
      );
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

    // 3. Fallback: Query unique society names from worker_profiles & employer_profiles if table is missing or empty
    if (societies.length === 0) {
      try {
        const namesRes = await queryDb(`
          SELECT DISTINCT name FROM (
            SELECT society_name as name FROM public.employer_profiles WHERE society_name IS NOT NULL AND society_name != ''
          ) t ORDER BY name ASC
        `);
        if (namesRes && namesRes.rows && namesRes.rows.length > 0) {
          societies = namesRes.rows.map((r: any, idx: number) => ({
            id: `soc_db_${idx + 1}`,
            name: r.name,
            locality: 'Active Zone',
            city: 'Noida / NCR'
          }));
        }
      } catch (nErr) {
        console.warn("Profiles society names query notice:", nErr);
      }
    }

    if (societies.length > 0) {
      memoryCache.set(cacheKey, societies, 300);
    }

    return NextResponse.json(
      { success: true, societies },
      { headers: { 'X-Cache': 'MISS-MEMORY', 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
    );
  } catch (err: any) {
    console.error("Societies API error:", err);
    return NextResponse.json({ error: err.message || 'Error fetching societies' }, { status: 500 });
  }
}
