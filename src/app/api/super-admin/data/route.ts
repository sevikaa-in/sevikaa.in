import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { memoryCache } from '@/lib/memoryCache';
import { verifyAdminSecurityContext } from '@/lib/adminSecurityGuard';

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminSecurityContext(req, { requiredRole: 'super-admin' });
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'overview';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const cacheKey = `superadmin_data_${tab}_p${page}_l${limit}`;

    const bypassCache = searchParams.get('fresh') === 'true' || searchParams.get('nocache') === 'true' || tab === 'workers';

    // 1. Check Server Memory Cache (if not bypassing)
    if (!bypassCache) {
      const cachedResponse = memoryCache.get<any>(cacheKey);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse, {
          headers: {
            'X-Cache': 'HIT-MEMORY',
            'Cache-Control': 'private, max-age=5, stale-while-revalidate=10'
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
    let admins: any[] = [];
    let stats = {
      totalWorkers: 0,
      verifiedWorkers: 0,
      pendingWorkers: 0,
      totalEmployers: 0,
      activeEmployers: 0,
      totalSocieties: 0,
      pendingJobs: 0,
      pendingReviews: 0
    };

    // 2. Fetch Summary Counts (Joining public.profiles for status)
    try {
      const statsRes = await queryDb(`
        SELECT 
          (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker') AS total_workers,
          (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND status = 'live') AS verified_workers,
          (SELECT COUNT(*) FROM public.profiles WHERE role = 'worker' AND (status = 'pending_review' OR status = 'admin_interview')) AS pending_workers,
          (SELECT COUNT(*) FROM public.employer_profiles) AS total_employers,
          (SELECT COUNT(*) FROM public.employer_profiles WHERE subscription_status = 'premium') AS active_employers,
          (SELECT COUNT(*) FROM public.societies) AS total_societies,
          (SELECT COUNT(*) FROM public.jobs WHERE status = 'pending' OR status = 'pending_review') AS pending_jobs
      `);
      if (statsRes?.rows?.[0]) {
        const row = statsRes.rows[0];
        stats = {
          totalWorkers: parseInt(row.total_workers || '0', 10),
          verifiedWorkers: parseInt(row.verified_workers || '0', 10),
          pendingWorkers: parseInt(row.pending_workers || '0', 10),
          totalEmployers: parseInt(row.total_employers || '0', 10),
          activeEmployers: parseInt(row.active_employers || '0', 10),
          totalSocieties: parseInt(row.total_societies || '0', 10),
          pendingJobs: parseInt(row.pending_jobs || '0', 10),
          pendingReviews: 0
        };
      }
    } catch (e) {
      console.warn("Stats query notice:", e);
    }



    // 3. Tab-based Paginated Fetching (Include 'interviews' tab)
    if (tab === 'workers' || tab === 'interviews' || tab === 'overview') {
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
                  wp.availability_slots,
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
           WHERE p.role = 'worker' OR wp.id IS NOT NULL
           ORDER BY p.created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (wRes?.rows) workers = wRes.rows;
      } catch (e) { console.warn("Workers fetch notice:", e); }
    }

    if (tab === 'employers' || tab === 'overview') {
      try {
        const eRes = await queryDb(
          `SELECT ep.*, p.email, p.phone, p.status
           FROM public.employer_profiles ep
           LEFT JOIN public.profiles p ON p.id::text = ep.user_id::text OR p.id::text = ep.id::text
           ORDER BY ep.created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (eRes?.rows) employers = eRes.rows;
      } catch (e) { console.warn("Employers fetch notice:", e); }
    }

    if (tab === 'societies' || tab === 'overview') {
      try {
        const sRes = await queryDb(
          `SELECT * FROM public.societies ORDER BY name ASC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (sRes?.rows) societies = sRes.rows;
      } catch (e) { console.warn("Societies fetch notice:", e); }
    }

    if (tab === 'jobs' || tab === 'overview') {
      try {
        const jRes = await queryDb(
          `SELECT * FROM public.jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (jRes?.rows) jobs = jRes.rows;
      } catch (e) { console.warn("Jobs fetch notice:", e); }
    }

    if (tab === 'admins' || tab === 'overview') {
      try {
        const aRes = await queryDb(
          `SELECT id, email, created_at FROM public.profiles WHERE role = 'admin' OR role = 'super-admin' LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        if (aRes?.rows) admins = aRes.rows;
      } catch (e) { console.warn("Admins fetch notice:", e); }
    }

    const payload = {
      success: true,
      page,
      limit,
      stats,
      workers,
      employers,
      societies,
      jobs,
      reviews,
      admins
    };

    memoryCache.set(cacheKey, payload, 60);

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS-MEMORY',
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    });
  } catch (err: any) {
    console.error("Super admin data API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
