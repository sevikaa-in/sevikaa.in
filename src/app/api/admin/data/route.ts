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



    const searchPattern = searchParams.get('q') ? `%${searchParams.get('q')}%` : null;
    const statusFilter = searchParams.get('status') || '';

    // 3. Tab-based Paginated Fetching
    if (tab === 'workers' || tab === 'overview' || tab === 'tele-onboarding') {
      try {
        const wRes = await queryDb(
          `SELECT COALESCE(wp.id::text, p.id::text) AS id,
                  COALESCE(wp.user_id::text, p.id::text) AS user_id,
                  COALESCE(p.email, '') AS email,
                  COALESCE(p.phone, wp.alternate_phone, wp.emergency_contact, '') AS phone,
                  COALESCE(p.status, 'pending_review') AS status,
                  COALESCE(p.created_at, wp.created_at, NOW()) AS created_at,
                  COALESCE(NULLIF(TRIM(wp.full_name), ''), NULLIF(TRIM(p.full_name), ''), CONCAT('Candidate ', RIGHT(COALESCE(p.phone, 'Lead'), 4))) AS name,
                  COALESCE(NULLIF(TRIM(wp.full_name), ''), NULLIF(TRIM(p.full_name), ''), CONCAT('Candidate ', RIGHT(COALESCE(p.phone, 'Lead'), 4))) AS full_name,
                  wp.gender, 
                  wp.age, 
                  wp.category,
                  wp.experience_years, 
                  wp.expected_salary, 
                  wp.skills, 
                  wp.languages_spoken, 
                  wp.bio,
                  COALESCE(wp.profile_picture_url, wp.avatar_url) AS profile_picture_url,
                  COALESCE(wp.avatar_url, wp.profile_picture_url) AS avatar_url,
                  wp.aadhaar_front_url, 
                  wp.aadhaar_back_url, 
                  wp.video_url, 
                  wp.police_verification_url, 
                  wp.preferred_shift, 
                  wp.emergency_contact, 
                  COALESCE(wp.alternate_phone, wp.emergency_contact) AS alternate_phone,
                  COALESCE(wp.is_tele_onboarded, false) AS is_tele_onboarded, 
                  COALESCE(wp.is_interview_verified, false) AS is_interview_verified, 
                  COALESCE(wp.is_aadhaar_front_verified, false) AS is_aadhaar_front_verified, 
                  COALESCE(wp.is_aadhaar_back_verified, false) AS is_aadhaar_back_verified, 
                  COALESCE(wp.is_aadhaar_verified, false) AS is_aadhaar_verified, 
                  COALESCE(wp.is_police_verified, false) AS is_police_verified, 
                  COALESCE(wp.is_video_verified, false) AS is_video_verified,
                  COALESCE(s.name, wp.preferred_society_name, (CASE WHEN array_length(wp.preferred_areas, 1) > 0 THEN wp.preferred_areas[1] ELSE NULL END)) AS primary_gated_society,
                  COALESCE(wp.secondary_society_name, (CASE WHEN array_length(wp.preferred_areas, 1) > 1 THEN wp.preferred_areas[2] ELSE NULL END)) AS secondary_gated_society,
                  wp.preferred_society_name, wp.secondary_society_name, wp.preferred_areas
           FROM public.profiles p
           LEFT JOIN public.worker_profiles wp ON wp.user_id::text = p.id::text OR wp.id::text = p.id::text
           LEFT JOIN public.societies s ON s.id::text = wp.preferred_society_id::text
           WHERE (p.role = 'worker' OR wp.id IS NOT NULL)
             AND ($3::text IS NULL OR p.phone LIKE $3 OR wp.alternate_phone LIKE $3 OR wp.full_name ILIKE $3 OR p.full_name ILIKE $3 OR wp.skills::text ILIKE $3 OR wp.category::text ILIKE $3 OR wp.preferred_society_name ILIKE $3 OR s.name ILIKE $3)
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
        const eRes = await queryDb(
          `SELECT p.id, p.email, p.phone, p.status, p.created_at,
                  ep.company_name, ep.name, ep.society_name, ep.address, ep.tower_block,
                  ep.city, ep.state, ep.pincode, ep.alternate_phone, ep.gstin,
                  COALESCE(ep.avatar_url, ep.profile_picture_url, wp.profile_picture_url) AS avatar_url,
                  COALESCE(ep.profile_picture_url, ep.avatar_url, wp.profile_picture_url) AS profile_picture_url,
                  ep.residency_proof_url AS residency_proof_url,
                  COALESCE(ep.aadhaar_front_url, wp.aadhaar_front_url) AS aadhaar_front_url,
                  COALESCE(ep.aadhaar_back_url, wp.aadhaar_back_url) AS aadhaar_back_url,
                  COALESCE(ep.is_tele_onboarded, false) AS is_tele_onboarded, 
                  COALESCE(ep.is_residency_verified, false) AS is_residency_verified, 
                  COALESCE(ep.is_aadhaar_front_verified, false) AS is_aadhaar_front_verified, 
                  COALESCE(ep.is_aadhaar_back_verified, false) AS is_aadhaar_back_verified, 
                  COALESCE(ep.is_aadhaar_verified, false) AS is_aadhaar_verified, 
                  COALESCE(ep.is_interview_verified, false) AS is_interview_verified
           FROM public.profiles p
           LEFT JOIN public.employer_profiles ep ON ep.user_id::text = p.id::text OR ep.id::text = p.id::text
           LEFT JOIN public.worker_profiles wp ON wp.user_id::text = p.id::text OR wp.id::text = p.id::text OR wp.user_id::text = ep.user_id::text
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
           WHERE ja.status IN ('interview_scheduled', 'confirmed')
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
