import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { memoryCache } from '@/lib/memoryCache';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'overview';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const cacheKey = `admin_data_${tab}_p${page}_l${limit}`;

    const bypassCache = searchParams.get('fresh') === 'true' || searchParams.get('nocache') === 'true';

    // 1. Check Server Memory Cache (if not bypassing)
    if (!bypassCache) {
      const cachedResponse = memoryCache.get<any>(cacheKey);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse, {
          headers: {
            'X-Cache': 'HIT-MEMORY',
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
          }
        });
      }
    }

    const offset = (page - 1) * limit;
    let workers: any[] = [];
    let employers: any[] = [];
    let societies: any[] = [];
    let jobs: any[] = [];
    let reviews: any[] = [];
    let counts = {
      pendingWorkers: 0,
      pendingEmployers: 0,
      pendingJobs: 0,
      pendingReviews: 0,
      interviewsToday: 0,
      activeDisputes: 0
    };

    // 2. Fetch Summary Counts (Joining public.profiles for status)
    try {
      const countsRes = await queryDb(`
        SELECT 
          (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND (status = 'pending_review' OR status = 'admin_interview')) AS pending_workers,
          (SELECT COUNT(*) FROM public.profiles WHERE role = 'employer' AND status = 'pending_review') AS pending_employers,
          (SELECT COUNT(*) FROM public.jobs WHERE status = 'pending' OR status = 'pending_review') AS pending_jobs,
          (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND status = 'admin_interview') AS interviews_today
      `);
      if (countsRes?.rows?.[0]) {
        const row = countsRes.rows[0];
        counts = {
          pendingWorkers: parseInt(row.pending_workers || '0', 10),
          pendingEmployers: parseInt(row.pending_employers || '0', 10),
          pendingJobs: parseInt(row.pending_jobs || '0', 10),
          pendingReviews: 0,
          interviewsToday: parseInt(row.interviews_today || '0', 10),
          activeDisputes: 0
        };
      }
    } catch (e) {
      console.warn("Admin counts query notice:", e);
    }

    const search = searchParams.get('q') || searchParams.get('search') || '';
    const searchPattern = search.trim() ? `%${search.trim()}%` : null;
    const statusFilter = searchParams.get('status') || '';

    // 3. Tab-based Paginated Fetching (Include 'interviews' and 'tele-onboarding' tabs)
    if (tab === 'workers' || tab === 'interviews' || tab === 'overview' || tab === 'tele-onboarding') {
      try {
        await queryDb(`
          ALTER TABLE public.worker_profiles 
          ADD COLUMN IF NOT EXISTS preferred_society_name text,
          ADD COLUMN IF NOT EXISTS secondary_society_name text,
          ADD COLUMN IF NOT EXISTS bio text,
          ADD COLUMN IF NOT EXISTS preferred_shift text,
          ADD COLUMN IF NOT EXISTS emergency_contact text,
          ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
          ADD COLUMN IF NOT EXISTS aadhaar_back_url text;
        `).catch(() => {});

        const wRes = await queryDb(
          `SELECT p.id, p.email, p.phone, p.status, p.created_at, wp.full_name AS profile_name,
                  COALESCE(
                    NULLIF(NULLIF(TRIM(wp.full_name), 'Worker Candidate'), ''),
                    NULLIF(TRIM(wp.full_name), ''),
                    CONCAT('Candidate ', RIGHT(COALESCE(p.phone, 'Lead'), 4))
                  ) AS full_name,
                  wp.skills, wp.languages_spoken, wp.age, wp.gender,
                  wp.expected_salary, wp.experience_years, wp.profile_picture_url,
                  wp.video_url, wp.aadhaar_front_url, wp.aadhaar_back_url,
                  wp.bio, wp.preferred_shift, wp.preferred_shift AS work_timing, wp.availability_slots, wp.emergency_contact,
                  COALESCE(s.name, wp.preferred_society_name, (wp.preferred_areas[1])) AS primary_gated_society,
                  COALESCE(wp.secondary_society_name, (CASE WHEN array_length(wp.preferred_areas, 1) > 1 THEN wp.preferred_areas[2] ELSE NULL END)) AS secondary_gated_society
           FROM public.profiles p
           LEFT JOIN public.worker_profiles wp ON wp.user_id::text = p.id::text OR wp.id::text = p.id::text
           LEFT JOIN public.societies s ON s.id::text = wp.preferred_society_id::text
           WHERE (p.role = 'worker' OR wp.id IS NOT NULL)
             AND ($3::text IS NULL OR p.phone LIKE $3 OR wp.full_name ILIKE $3)
             AND ($4::text = '' OR p.status = $4 OR ($4 = 'approved' AND p.status IN ('approved', 'live', 'active', 'completed')) OR ($4 = 'suspended' AND p.status IN ('suspended', 'rejected', 'deactivated', 'changes_requested')))
           ORDER BY p.created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset, searchPattern, statusFilter]
        );
        if (wRes?.rows) workers = wRes.rows;
      } catch (e) { console.warn("Admin workers fetch notice:", e); }
    }

    if (tab === 'employers' || tab === 'overview' || tab === 'tele-onboarding') {
      try {
        await queryDb(`
          ALTER TABLE public.employer_profiles 
          ADD COLUMN IF NOT EXISTS company_name text,
          ADD COLUMN IF NOT EXISTS society_name text,
          ADD COLUMN IF NOT EXISTS tower_block text,
          ADD COLUMN IF NOT EXISTS address text,
          ADD COLUMN IF NOT EXISTS city text,
          ADD COLUMN IF NOT EXISTS state text,
          ADD COLUMN IF NOT EXISTS pincode text,
          ADD COLUMN IF NOT EXISTS gstin text,
          ADD COLUMN IF NOT EXISTS alternate_phone text,
          ADD COLUMN IF NOT EXISTS verification_requirement text,
          ADD COLUMN IF NOT EXISTS status text,
          ADD COLUMN IF NOT EXISTS avatar_url text,
          ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
          ADD COLUMN IF NOT EXISTS aadhaar_back_url text;
        `).catch(() => {});

        const eRes = await queryDb(
          `SELECT p.id, p.email, p.phone, p.status, p.created_at,
                  COALESCE(
                    NULLIF(TRIM(ep.company_name), ''),
                    NULLIF(TRIM(ep.name), ''),
                    CONCAT('Employer ', RIGHT(COALESCE(p.phone, 'Lead'), 4))
                  ) AS company_name,
                  COALESCE(
                    NULLIF(TRIM(ep.society_name), ''), 
                    NULLIF(TRIM(p.society_name), ''), 
                    (SELECT COALESCE(j.society_name, s.name) FROM public.jobs j LEFT JOIN public.societies s ON s.id::text = j.society_id::text WHERE (j.employer_id::text = p.id::text OR j.employer_id::text = ep.user_id::text OR j.employer_id::text = ep.id::text) AND (j.society_name IS NOT NULL OR s.name IS NOT NULL) LIMIT 1)
                  ) AS society_name,
                  COALESCE(ep.address, ep.billing_address) AS address,
                  ep.tower_block,
                  ep.city, ep.state, ep.pincode, ep.alternate_phone, ep.gstin,
                  ep.verification_requirement, ep.avatar_url, ep.aadhaar_front_url, ep.aadhaar_back_url
           FROM public.profiles p
           LEFT JOIN public.employer_profiles ep ON ep.user_id::text = p.id::text OR ep.id::text = p.id::text
           WHERE (p.role = 'employer' OR ep.id IS NOT NULL)
           ORDER BY p.created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (eRes?.rows) employers = eRes.rows;
      } catch (e) { console.warn("Admin employers fetch notice:", e); }
    }

    if (tab === 'societies' || tab === 'overview') {
      try {
        const sRes = await queryDb(
          `SELECT * FROM public.societies ORDER BY name ASC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (sRes?.rows) societies = sRes.rows;
      } catch (e) { console.warn("Admin societies fetch notice:", e); }
    }

    if (tab === 'jobs' || tab === 'overview') {
      try {
        const jRes = await queryDb(
          `SELECT j.*,
                  COALESCE(NULLIF(TRIM(ep.name), ''), NULLIF(TRIM(ep.company_name), ''), CONCAT('Employer ', RIGHT(COALESCE(p.phone, 'Lead'), 4))) AS employer_name,
                  p.phone AS employer_phone,
                  p.phone AS phone,
                  COALESCE(s.name, 'Gated Community') AS society_name,
                  COALESCE(ep.billing_address, s.city, 'Noida') AS locality
           FROM public.jobs j
           LEFT JOIN public.profiles p ON p.id::text = j.employer_id::text
           LEFT JOIN public.employer_profiles ep ON ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text
           LEFT JOIN public.societies s ON s.id::text = j.society_id::text OR j.society_name ILIKE CONCAT('%', s.name, '%')
           ORDER BY j.created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (jRes?.rows) jobs = jRes.rows;
      } catch (e) { console.warn("Admin jobs fetch notice:", e); }
    }

    let interviews: any[] = [];

    if (tab === 'interviews' || tab === 'tele-onboarding' || tab === 'overview') {
      try {
        // Guarantee columns exist on public.applications
        await queryDb(`
          ALTER TABLE public.applications 
          ADD COLUMN IF NOT EXISTS reschedule_time text,
          ADD COLUMN IF NOT EXISTS reschedule_note text,
          ADD COLUMN IF NOT EXISTS interview_time text,
          ADD COLUMN IF NOT EXISTS interview_note text;
        `).catch(() => {});

        const iRes = await queryDb(
          `SELECT ja.id, ja.job_id, ja.worker_id, ja.status, ja.created_at, 
                  COALESCE(ja.reschedule_time, ja.interview_time, '') AS reschedule_time, 
                  COALESCE(ja.reschedule_note, ja.interview_note, '') AS reschedule_note,
                  COALESCE(ja.reschedule_time, ja.interview_time, '') AS scheduled_time,
                  COALESCE(wp.full_name, 'Worker Candidate') AS worker_name,
                  COALESCE(wp.full_name, 'Worker Candidate') AS full_name,
                  pw.phone AS worker_phone,
                  pw.phone AS phone,
                  COALESCE(ep.name, ep.company_name, 'Household Employer') AS employer_name,
                  pe.phone AS employer_phone,
                  COALESCE(s.name, 'Gated Society') AS society_name,
                  COALESCE(ep.billing_address, 'Tower B') AS address,
                  COALESCE(j.category, 'Domestic Worker') AS job_title,
                  j.category AS job_category,
                  COALESCE(j.salary_range_min, 15000) AS salary_offered,
                  wp.gender, wp.age, wp.expected_salary, wp.experience_years,
                  wp.bio, wp.preferred_shift, wp.preferred_shift AS work_timing,
                  wp.skills, wp.languages_spoken,
                  wp.profile_picture_url, wp.aadhaar_front_url, wp.aadhaar_back_url, wp.video_url,
                  COALESCE(s.name, wp.preferred_society_name, (wp.preferred_areas[1])) AS primary_gated_society,
                  COALESCE(wp.secondary_society_name, (CASE WHEN array_length(wp.preferred_areas, 1) > 1 THEN wp.preferred_areas[2] ELSE NULL END)) AS secondary_gated_society
           FROM public.applications ja
           LEFT JOIN public.worker_profiles wp ON wp.user_id = ja.worker_id OR wp.id = ja.worker_id
           LEFT JOIN public.profiles pw ON pw.id = ja.worker_id
           LEFT JOIN public.jobs j ON j.id = ja.job_id
           LEFT JOIN public.profiles pe ON pe.id = j.employer_id
           LEFT JOIN public.employer_profiles ep ON ep.user_id = j.employer_id OR ep.id = j.employer_id
           LEFT JOIN public.societies s ON s.id = j.society_id
           ORDER BY ja.created_at DESC
           LIMIT 50`
        );
        if (iRes?.rows) interviews = iRes.rows;
      } catch (e) {
        console.warn("Admin interviews fetch notice:", e);
      }
    }

    const payload = {
      success: true,
      page,
      limit,
      counts,
      workers,
      employers,
      societies,
      jobs,
      reviews,
      interviews
    };

    memoryCache.set(cacheKey, payload, 60);

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS-MEMORY',
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    });
  } catch (err: any) {
    console.error("Admin data API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
